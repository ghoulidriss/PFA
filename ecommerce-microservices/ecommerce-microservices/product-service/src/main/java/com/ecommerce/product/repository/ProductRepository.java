package com.ecommerce.product.repository;

import com.ecommerce.product.model.Product;
import com.ecommerce.product.model.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategory(String category);

    List<Product> findByStatus(ProductStatus status);

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByPriceLessThanEqual(BigDecimal maxPrice);

    List<Product> findByCategoryAndStatus(String category, ProductStatus status);

    @Query("SELECT SUM(p.stockQuantity) FROM Product p")
    Long sumStockQuantity();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = 'OUT_OF_STOCK'")
    Long countOutOfStock();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = 'AVAILABLE'")
    Long countAvailable();
}
