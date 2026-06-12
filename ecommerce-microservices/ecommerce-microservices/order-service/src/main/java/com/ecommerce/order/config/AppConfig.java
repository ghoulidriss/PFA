package com.ecommerce.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        // HttpComponentsClientHttpRequestFactory (Apache HttpClient 5) is required
        // because the default Java HttpURLConnection does not support PATCH requests,
        // which causes a ProtocolException when calling the product-service stock endpoint.
        return new RestTemplate(new HttpComponentsClientHttpRequestFactory());
    }
}
