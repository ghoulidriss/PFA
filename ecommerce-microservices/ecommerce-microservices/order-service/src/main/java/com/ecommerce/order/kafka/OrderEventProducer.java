package com.ecommerce.order.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendOrderCreatedEvent(Long orderId, String username, String status) {
        try {
            Map<String, Object> event = Map.of(
                    "eventType", "ORDER_CREATED",
                    "orderId", orderId,
                    "username", username,
                    "status", status,
                    "timestamp", System.currentTimeMillis()
            );
            kafkaTemplate.send("order-events", String.valueOf(orderId), event);
            log.info("Sent ORDER_CREATED event for order: {}", orderId);
        } catch (Exception e) {
            log.warn("Kafka unavailable — ORDER_CREATED event not sent for order {}: {}", orderId, e.getMessage());
        }
    }

    public void sendOrderStatusChangedEvent(Long orderId, String newStatus) {
        try {
            Map<String, Object> event = Map.of(
                    "eventType", "ORDER_STATUS_CHANGED",
                    "orderId", orderId,
                    "newStatus", newStatus,
                    "timestamp", System.currentTimeMillis()
            );
            kafkaTemplate.send("order-events", String.valueOf(orderId), event);
            log.info("Sent ORDER_STATUS_CHANGED event for order: {} -> {}", orderId, newStatus);
        } catch (Exception e) {
            log.warn("Kafka unavailable — ORDER_STATUS_CHANGED event not sent for order {}: {}", orderId, e.getMessage());
        }
    }
}
