# ChainTrack — Smart Supply Chain Proof-of-Origin Platform

[![Coverage](https://img.shields.io/badge/coverage-75%25-brightgreen)](https://github.com/redkiros81294/se4801-group-SY/actions)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=java)](https://www.java.com)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)

## Overview

ChainTrack solves the problem of counterfeit goods and lack of transparency in supply chains. Every time a product moves from manufacturer to shipper to retailer, ChainTrack records that movement as a cryptographically signed transaction. Anyone can scan a product's QR code and see the full verified journey of that product from factory to shelf.

The unique feature is a hash-chained ledger — each movement transaction stores a SHA-256 hash that includes the previous transaction's hash, making the chain tamper-evident. If anyone modifies a transaction in the database, the entire chain verification fails and the batch is flagged as COMPROMISED.

## Team Members

- **Member A**: Yared Kiros (Backend Developer - Entities, Services, Controllers)
- **Member B**: Simon Mesfin (Frontend Developer - React Frontend, Deployment)

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.x, Maven
- **Database**: PostgreSQL 15, Spring Data JPA, Flyway migrations
- **Security**: Spring Security 6, JJWT 0.12.6 (stateless JWT)
- **QR Codes**: ZXing 3.5.3
- **API Docs**: SpringDoc OpenAPI 2.5.0 (Swagger UI)
- **Testing**: JUnit 5, Mockito, Testcontainers, JaCoCo
- **Deployment**: Docker + Docker Compose (Render free tier)
- **Frontend**: React 18, Vite, Tailwind CSS, jsQR (camera QR scan)

Base package: `com.chaintrack`

## User Roles

- **ADMIN**: Manages all users and organizations, views system-wide analytics, accesses everything
- **MANUFACTURER**: Creates products and batches, generates QR codes for each batch, logs the first supply chain event (MANUFACTURED)
- **SHIPPER**: Logs movement events (SHIPPED, IN_TRANSIT), views assigned shipments, read-only on products
- **RETAILER**: Logs the final event (RECEIVED), scans QR codes to verify authenticity, views received inventory

## Domain Entities

- **Organization**: Represents a company in the supply chain. Can be of type MANUFACTURER, SHIPPER, or RETAILER. Every user belongs to one organization.
- **User**: A person who logs into the system. Has one role and belongs to one organization. Password is always BCrypt(12) hashed.
- **Product**: A type of item being tracked (e.g. "Paracetamol 500mg"). Created by a MANUFACTURER. Has a unique SKU. One product can have many batches.
- **Batch**: A specific production run of a product (e.g. 500 units manufactured on a specific date). Has a unique batch number in the format {SKU}-{yyyyMMdd}-{UUID first 8 chars}. Has a status: CREATED, IN_TRANSIT, DELIVERED, or COMPROMISED. One batch has exactly one QR token.
- **MovementTransaction**: Records one supply chain event for a batch. Event types are: MANUFACTURED → SHIPPED → IN_TRANSIT → RECEIVED. Each transaction stores a SHA-256 signatureHash computed from: eventType + timestamp + fromOrgId + toOrgId + previousHash. The previousHash is the signatureHash of the previous transaction (or "GENESIS" for the very first event). This chain is immutable — transactions are never updated or deleted.
- **QRToken**: One QR code per batch, generated using ZXing. Stores the Base64-encoded PNG image and a unique UUID token value. The public verify endpoint uses this token to look up the batch and return its full provenance chain.

## REST Endpoints

### Authentication (public):
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — returns JWT token
- `POST /api/auth/logout` — blacklists the token

### Organizations (ADMIN only):
- `GET /api/organizations` — paginated list
- `POST /api/organizations` — create organization

### Products (public read, MANUFACTURER write):
- `GET /api/products` — paginated list (public)
- `POST /api/products` — create product (MANUFACTURER)
- `GET /api/products/{id}` — get by id (public)
- `PATCH /api/products/{id}` — update (MANUFACTURER, own only)
- `GET /api/products/search` — search by name, category, sku, fromDate (public, multi-param)

### Batches (authenticated):
- `POST /api/batches` — create batch (MANUFACTURER)
- `GET /api/batches/{id}` — get batch details (all roles)
- `POST /api/batches/{id}/qr` — generate QR code (MANUFACTURER)

### Transactions (authenticated):
- `POST /api/transactions` — log a supply chain event
- `GET /api/transactions/batch/{batchId}` — full history (all roles, paginated)

### Verify (fully public — the QR scan endpoint):
- `GET /api/verify/{token}` — returns full provenance chain, re-validates all hashes on every call

### Admin (ADMIN only):
- `GET /api/admin/users` — paginated user list
- `GET /api/admin/analytics` — system-wide statistics

## The Unique UI Feature

The React frontend has a /scan page that uses the browser's camera (via jsQR library) to scan a printed QR code on a product. On successful decode it calls `GET /api/verify/{token}` and displays the full provenance timeline — green if the chain is valid, red with a COMPROMISED warning if any hash has been tampered with.

This works on mobile Chrome and Safari with no app install required. JWT is stored in React state only (never localStorage). The API base URL comes from the `VITE_API_URL` environment variable.

## Project Structure

```
se4801-group-SY/
├── src/
│   ├── main/
│   │   ├── java/com/chaintrack/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── model/
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── exception/
│   │   │   ├── security/
│   │   │   └── mapper/
│   │   └── resources/
│   │       ├── db/migration/  (V1 through V7 Flyway scripts)
│   │       ├── application.properties
│   │       ├── application-prod.properties
│   │       └── application-test.properties
│   └── test/java/com/chaintrack/
│       ├── service/
│       ├── controller/
│       ├── repository/
│       └── security/
├── frontend/               (React 18 + Vite + Tailwind)
├── Dockerfile
├── docker-compose.yml
├── pom.xml
└── README.md
```

## Build and Run Instructions

### Prerequisites
- Java 21
- Maven 3.x
- Node.js 18+ (for frontend)
- Docker and Docker Compose

### Backend Setup
1. Clone the repository.
2. Navigate to the project root.
3. Run `mvn clean install` to build the project.
4. Run `mvn spring-boot:run` to start the backend server on port 8080.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

### Using Docker
1. Ensure Docker and Docker Compose are installed.
2. Run `docker-compose up` to start the application with PostgreSQL database.
3. The backend will be available at `http://localhost:8080`.
4. The frontend will be available at the configured VITE_API_URL.

### Testing
- Run `mvn test` for backend tests.
- For frontend tests, navigate to `frontend` and run `npm test`.

## Test Coverage

[![Coverage](https://img.shields.io/badge/coverage-75%25-brightgreen)]()

Run `mvn jacoco:report` to generate coverage report in `target/site/jacoco/index.html`.

## Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│ Spring Boot │────▶│ PostgreSQL  │
│ Frontend    │     │   API       │     │ Database    │
│ (Vite)      │     │ (Port 8080) │     │ (Port 5432) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │ Flyway      │
                   │ Migrations  │
                   └─────────────┘
```

## Environment Variables
- `VITE_API_URL`: Base URL for the API (e.g., `http://localhost:8080/api`)