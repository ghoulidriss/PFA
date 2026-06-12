package com.ecommerce.product.service;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.dto.StockStats;
import com.ecommerce.product.kafka.ProductEventProducer;
import com.ecommerce.product.model.Product;
import com.ecommerce.product.model.ProductStatus;
import com.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductEventProducer eventProducer;

    public ProductResponse createProduct(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .build();

        Product saved = productRepository.save(product);
        eventProducer.sendProductCreatedEvent(saved.getId(), saved.getName());
        log.info("Product created: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByMaxPrice(BigDecimal maxPrice) {
        return productRepository.findByPriceLessThanEqual(maxPrice).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAvailableProducts() {
        return productRepository.findByStatus(ProductStatus.AVAILABLE).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        int oldStock = product.getStockQuantity();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(request.getCategory());
        product.setStockQuantity(request.getStockQuantity());
        product.setImageUrl(request.getImageUrl());

        Product updated = productRepository.save(product);

        if (oldStock != request.getStockQuantity()) {
            eventProducer.sendStockUpdatedEvent(id, request.getStockQuantity());
        }

        return toResponse(updated);
    }

    public void decreaseStock(Long id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        if (product.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock for product: " + id);
        }

        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);
        eventProducer.sendStockReservedEvent(id, quantity);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
        log.info("Product deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public StockStats getStockStats() {
        long total = productRepository.count();
        Long available = productRepository.countAvailable();
        Long outOfStock = productRepository.countOutOfStock();
        Long totalUnits = productRepository.sumStockQuantity();

        return StockStats.builder()
                .totalProducts(total)
                .availableProducts(available != null ? available : 0)
                .outOfStockProducts(outOfStock != null ? outOfStock : 0)
                .discontinuedProducts(productRepository.findByStatus(ProductStatus.DISCONTINUED).size())
                .totalStockUnits(totalUnits != null ? totalUnits : 0)
                .build();
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .category(product.getCategory())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
