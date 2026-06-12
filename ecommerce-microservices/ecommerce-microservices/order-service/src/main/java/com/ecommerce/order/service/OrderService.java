package com.ecommerce.order.service;

import com.ecommerce.order.dto.*;
import com.ecommerce.order.kafka.OrderEventProducer;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventProducer eventProducer;
    private final RestTemplate restTemplate;

    @Value("${services.product-service-url}")
    private String productServiceUrl;

    @SuppressWarnings("unchecked")
    public OrderResponse createOrder(String username, CreateOrderRequest request) {
        Order order = Order.builder()
                .username(username)
                .shippingAddress(request.getShippingAddress())
                .status(OrderStatus.PENDING)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new java.util.ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            // Fetch product details from product-service
            Map<String, Object> product = restTemplate.getForObject(
                    productServiceUrl + "/api/products/" + itemReq.getProductId(),
                    Map.class
            );

            if (product == null) throw new RuntimeException("Product not found: " + itemReq.getProductId());

            BigDecimal unitPrice = new BigDecimal(product.get("price").toString());
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.getProductId())
                    .productName(product.get("name").toString())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();

            items.add(item);
            total = total.add(subtotal);

            // Decrease stock via REST call
            restTemplate.patchForObject(
                    productServiceUrl + "/api/products/" + itemReq.getProductId()
                            + "/stock/decrease?quantity=" + itemReq.getQuantity(),
                    null, Void.class
            );
        }

        order.setItems(items);
        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);
        eventProducer.sendOrderCreatedEvent(saved.getId(), username, saved.getStatus().name());
        log.info("Order created: {} for user: {}", saved.getId(), username);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUser(String username) {
        return orderRepository.findByUsernameOrderByCreatedAtDesc(username)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        return toResponse(order);
    }

    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        eventProducer.sendOrderStatusChangedEvent(id, newStatus.name());
        return toResponse(updated);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getOrderStats() {
        return Map.of(
                "total", orderRepository.count(),
                "pending", orderRepository.countByStatus(OrderStatus.PENDING),
                "confirmed", orderRepository.countByStatus(OrderStatus.CONFIRMED),
                "shipped", orderRepository.countByStatus(OrderStatus.SHIPPED),
                "delivered", orderRepository.countByStatus(OrderStatus.DELIVERED),
                "cancelled", orderRepository.countByStatus(OrderStatus.CANCELLED)
        );
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .username(order.getUsername())
                .items(itemResponses)
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
