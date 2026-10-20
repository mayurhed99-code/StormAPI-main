package com.ravitej.stormapi.report.config;

import com.ravitej.stormapi.common.security.JsonAuthenticationEntryPoint;
import com.ravitej.stormapi.common.security.JwtAuthenticationFilter;
import com.ravitej.stormapi.common.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public JwtService jwtService(@Value("${stormapi.jwt.secret}") String secret,
                                 @Value("${stormapi.jwt.ttl-ms:86400000}") long ttlMillis) {
        return new JwtService(secret, ttlMillis);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * No-op UserDetailsService.
     * Satisfies UserDetailsServiceAutoConfiguration's @ConditionalOnMissingBean guard.
     * Stateless JWT filter handles all authentication; this bean is never invoked.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UnsupportedOperationException(
                    "UserDetailsService is not used; authentication is handled by JwtAuthenticationFilter.");
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService,
                                                       PasswordEncoder passwordEncoder) {
        // Use the Spring Security 6.x constructor that takes UserDetailsService to avoid deprecation
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**", "/actuator/health", "/actuator/info").permitAll()
                        // WebSocket handshake for the live dashboard; STOMP frames carry no JWT in the MVP.
                        .requestMatchers("/ws/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(handling -> handling.authenticationEntryPoint(new JsonAuthenticationEntryPoint()))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
