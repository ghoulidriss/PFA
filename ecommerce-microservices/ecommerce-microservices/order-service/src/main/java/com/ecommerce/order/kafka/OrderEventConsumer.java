package com.ecommerce.order.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class OrderEventConsumer {

    @KafkaListener(topics = "stock-alerts", groupId = "order-service-group")
    public void handleStockAlert(Map<String, Object> event) {
        String alertType = (String) event.get("alertType");
        Object productId = event.get("productId");
        log.warn("Received stock alert: type={}, productId={}", alertType, productId);

        if ("OUT_OF_STOCK".equals(alertType)) {
            log.warn("Product {} is out of stock — pending orders may be affected", productId);
            // Business logic: notify pending orders with this product
        }
    }

    @KafkaListener(topics = "product-events", groupId = "order-service-group")
    public void handleProductEvent(Map<String, Object> event) {
        String eventType = (String) event.get("eventType");
        log.info("Received product event: {}", eventType);
    }
}
