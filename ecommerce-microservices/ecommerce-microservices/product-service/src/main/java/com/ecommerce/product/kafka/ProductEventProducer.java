package com.ecommerce.product.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class ProductEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.product-events}")
    private String productEventsTopic;

    @Value("${kafka.topics.stock-alerts}")
    private String stockAlertsTopic;

    public void sendProductCreatedEvent(Long productId, String productName) {
        try {
            Map<String, Object> event = Map.of(
                    "eventType", "PRODUCT_CREATED",
                    "productId", productId,
                    "productName", productName,
                    "timestamp", System.currentTimeMillis()
            );
            kafkaTemplate.send(productEventsTopic, String.valueOf(productId), event);
            log.info("Sent PRODUCT_CREATED event for product: {}", productId);
        } catch (Exception e) {
            log.warn("Kafka unavailable — PRODUCT_CREATED event not sent for product {}: {}", productId, e.getMessage());
        }
    }

    public void sendStockUpdatedEvent(Long productId, int newStock) {
        try {
            Map<String, Object> event = Map.of(
                    "eventType", "STOCK_UPDATED",
                    "productId", productId,
                    "newStock", newStock,
                    "timestamp", System.currentTimeMillis()
            );
            kafkaTemplate.send(productEventsTopic, String.valueOf(productId), event);
            log.info("Sent STOCK_UPDATED event for product: {}, new stock: {}", productId, newStock);

            if (newStock == 0) {
                Map<String, Object> alert = Map.of(
                        "alertType", "OUT_OF_STOCK",
                        "productId", productId,
                        "timestamp", System.currentTimeMillis()
                );
                kafkaTemplate.send(stockAlertsTopic, String.valueOf(productId), alert);
                log.warn("Sent OUT_OF_STOCK alert for product: {}", productId);
            }
        } catch (Exception e) {
            log.warn("Kafka unavailable — STOCK_UPDATED event not sent for product {}: {}", productId, e.getMessage());
        }
    }

    public void sendStockReservedEvent(Long productId, int reservedQuantity) {
        try {
            Map<String, Object> event = Map.of(
                    "eventType", "STOCK_RESERVED",
                    "productId", productId,
                    "reservedQuantity", reservedQuantity,
                    "timestamp", System.currentTimeMillis()
            );
            kafkaTemplate.send(productEventsTopic, String.valueOf(productId), event);
            log.info("Sent STOCK_RESERVED event for product: {}", productId);
        } catch (Exception e) {
            log.warn("Kafka unavailable — STOCK_RESERVED event not sent for product {}: {}", productId, e.getMessage());
        }
    }
}
