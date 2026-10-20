package com.ravitej.stormapi.gateway.auth;

import com.ravitej.stormapi.common.security.JwtService;
import com.ravitej.stormapi.gateway.auth.AuthDtos.AuthResponse;
import com.ravitej.stormapi.gateway.user.User;
import com.ravitej.stormapi.gateway.user.UserRepository;
import com.ravitej.stormapi.gateway.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(String email, String rawPassword) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken", "An account with this email already exists");
        }
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setCreatedAt(Instant.now());
        user = userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), user.getId(), user.getEmail());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String email, String rawPassword) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "Invalid email or password"));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "Invalid email or password");
        }
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), user.getId(), user.getEmail());
    }
}
