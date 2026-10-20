package com.ravitej.stormapi.gateway.auth;

import com.ravitej.stormapi.common.security.AuthenticatedUser;
import com.ravitej.stormapi.common.security.SecurityUtils;
import com.ravitej.stormapi.gateway.auth.AuthDtos.AuthResponse;
import com.ravitej.stormapi.gateway.auth.AuthDtos.LoginRequest;
import com.ravitej.stormapi.gateway.auth.AuthDtos.MeResponse;
import com.ravitej.stormapi.gateway.auth.AuthDtos.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request.email(), request.password()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.email(), request.password()));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me() {
        AuthenticatedUser user = SecurityUtils.currentUser();
        return ResponseEntity.ok(new MeResponse(user.userId(), user.email()));
    }
}
