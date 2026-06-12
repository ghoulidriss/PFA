package com.ecommerce.product.service;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.dto.StockStats;
import com.ecommerce.product.kafka.ProductEventProducer;
import com.ecommerce.product.model.Product;
import com.ecommerce.product.model.ProductStatus;
import com.ecommerce.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Unit Tests")
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductEventProducer eventProducer;
    @InjectMocks private ProductService productService;

    private Product mockProduct;
    private ProductRequest productRequest;

    @BeforeEach
    void setUp() {
        mockProduct = Product.builder()
                .id(1L)
                .name("Laptop Pro X")
                .description("High-end laptop")
                .price(new BigDecimal("1299.99"))
                .category("Electronics")
                .stockQuantity(10)
                .status(ProductStatus.AVAILABLE)
                .build();

        productRequest = new ProductRequest();
        productRequest.setName("Laptop Pro X");
        productRequest.setDescription("High-end laptop");
        productRequest.setPrice(new BigDecimal("1299.99"));
        productRequest.setCategory("Electronics");
        productRequest.setStockQuantity(10);
    }

    @Test
    @DisplayName("Should create product and send Kafka event")
    void createProduct_ShouldSaveAndPublishEvent() {
        when(productRepository.save(any(Product.class))).thenReturn(mockProduct);

        ProductResponse response = productService.createProduct(productRequest);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Laptop Pro X");
        assertThat(response.getPrice()).isEqualByComparingTo("1299.99");
        verify(productRepository).save(any(Product.class));
        verify(eventProducer).sendProductCreatedEvent(1L, "Laptop Pro X");
    }

    @Test
    @DisplayName("Should return product by ID")
    void getProductById_ShouldReturnProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        ProductResponse response = productService.getProductById(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Laptop Pro X");
        assertThat(response.getStatus()).isEqualTo(ProductStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Should throw when product not found")
    void getProductById_ShouldThrow_WhenNotFound() {
        when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    @DisplayName("Should decrease stock and publish event")
    void decreaseStock_ShouldUpdateStockAndSendEvent() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));
        when(productRepository.save(any())).thenReturn(mockProduct);

        productService.decreaseStock(1L, 3);

        verify(productRepository).save(any(Product.class));
        verify(eventProducer).sendStockReservedEvent(1L, 3);
    }

    @Test
    @DisplayName("Should throw when insufficient stock")
    void decreaseStock_ShouldThrow_WhenInsufficientStock() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> productService.decreaseStock(1L, 100))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    @DisplayName("Should return stock statistics")
    void getStockStats_ShouldReturnCorrectStats() {
        when(productRepository.count()).thenReturn(50L);
        when(productRepository.countAvailable()).thenReturn(35L);
        when(productRepository.countOutOfStock()).thenReturn(10L);
        when(productRepository.sumStockQuantity()).thenReturn(245L);
        when(productRepository.findByStatus(ProductStatus.DISCONTINUED)).thenReturn(List.of());

        StockStats stats = productService.getStockStats();

        assertThat(stats.getTotalProducts()).isEqualTo(50);
        assertThat(stats.getAvailableProducts()).isEqualTo(35);
        assertThat(stats.getOutOfStockProducts()).isEqualTo(10);
        assertThat(stats.getTotalStockUnits()).isEqualTo(245);
    }
}
