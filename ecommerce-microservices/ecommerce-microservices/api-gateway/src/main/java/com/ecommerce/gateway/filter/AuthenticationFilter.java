package com.ecommerce.gateway.filter;

import com.ecommerce.gateway.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.isTokenValid(token)) {
                return onError(exchange, "Invalid or expired JWT token");
            }

            String username = jwtUtil.extractUsername(token);
            log.debug("Authenticated user: {}", username);

            return chain.filter(exchange.mutate()
                    .request(exchange.getRequest().mutate()
                            .header("X-Auth-User", username)
                            .build())
                    .build());
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message) {
        log.warn("Authentication error: {}", message);
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config {}
}
