package com.ravitej.stormapi.report.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over WebSocket configuration (Phase 4).
 *
 * Endpoint: /ws  (Nginx proxies /ws → report-service:8080/ws)
 * Subscribe: /topic/runs/{runId}  — one topic per run
 * Send:      /app/**              — not used in MVP (server pushes only)
 *
 * WebSocket handshake is permitAll in SecurityConfig (no JWT in STOMP
 * handshake for MVP — documented in Architecture.md §4 note).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple in-memory broker; no external broker needed for MVP.
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
