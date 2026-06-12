package com.ecommerce.product.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Column(length = 1000)
    private String description;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal price;

    @NotBlank
    private String category;

    @NotNull
    @Min(0)
    private Integer stockQuantity;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = stockQuantity > 0 ? ProductStatus.AVAILABLE : ProductStatus.OUT_OF_STOCK;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        status = stockQuantity > 0 ? ProductStatus.AVAILABLE : ProductStatus.OUT_OF_STOCK;
    }
}
