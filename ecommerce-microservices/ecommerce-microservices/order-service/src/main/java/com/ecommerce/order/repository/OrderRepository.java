package com.ecommerce.order.repository;

import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUsername(String username);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByUsernameOrderByCreatedAtDesc(String username);
    long countByStatus(OrderStatus status);
}
