package com.ravitej.stormapi.report.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Read-only view of api_targets used to scope reports to the authenticated
 * user (userId column is the ownership anchor).
 */
@Entity
@Table(name = "api_targets")
public class ApiTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "base_url", nullable = false, length = 2048)
    private String baseUrl;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(name = "headers_json", columnDefinition = "TEXT")
    private String headersJson;

    @Column(name = "body_template", columnDefinition = "TEXT")
    private String bodyTemplate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }
}
