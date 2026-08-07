package com.chaintrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization_registration_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRegistrationRequest {

    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String companyName;

    @Column(nullable = false, length = 50)
    private String orgType;

    @Column(nullable = false, length = 255)
    private String contactEmail;

    @Column(nullable = false, length = 255)
    private String contactName;

    @Column(length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Status {
        PENDING,
        APPROVED,
        REJECTED
    }
}
