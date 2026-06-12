package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StockStats {
    private long totalProducts;
    private long availableProducts;
    private long outOfStockProducts;
    private long discontinuedProducts;
    private long totalStockUnits;
}
