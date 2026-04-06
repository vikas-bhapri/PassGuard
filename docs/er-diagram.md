# PassGuard — Database ER Diagram

## Entity-Relationship Diagram

```mermaid
erDiagram
    User {
        UUID id PK
        String username UK "unique, indexed"
        String email UK "unique, indexed"
        String first_name "nullable"
        String last_name "nullable"
        String image_url "nullable"
        String hashed_password "bcrypt hash"
        String role "default: user"
        DateTime created_at "default: now"
        DateTime updated_at "nullable"
        Boolean new_user "default: True"
        Boolean master_password_set "default: False"
        String auth_algo "PBKDF2-SHA256"
        Integer auth_iterations "125000"
        String auth_salt_b64u "base64url encoded salt"
        String auth_verifier_b64u "32-byte HMAC key (base64url)"
        String vault_algo "PBKDF2-SHA256"
        Integer vault_iterations "125000"
        String vault_salt_b64u "base64url encoded salt"
    }

    AuthToken {
        UUID id PK
        UUID user_id FK "indexed"
        String token UK "JWT refresh token"
        DateTime expires_at
    }

    Services {
        UUID id PK
        String name UK "service name (e.g. Gmail)"
        String image_url "nullable"
    }

    Passwords {
        UUID id PK
        UUID user_id FK
        String service_name FK "references Services.name"
        String username "username for this service"
        String ciphertext_b64u "AES-GCM encrypted password"
        String iv_b64u "12-byte IV (base64url)"
        DateTime created_at "default: now"
        DateTime updated_at "nullable"
        Boolean is_favorite "default: False"
    }

    PasswordResetToken {
        UUID id PK
        UUID user_id FK
        String token UK "SHA256 hash of reset token"
        DateTime expires_at "1 hour from creation"
        Boolean used "default: False"
    }

    User ||--o{ AuthToken : "has refresh tokens"
    User ||--o{ Passwords : "owns passwords"
    User ||--o{ PasswordResetToken : "has reset tokens"
    Services ||--o{ Passwords : "linked to passwords"
```

## Table Details

### User

The central entity. Stores account credentials (bcrypt-hashed password), profile info, and **two sets of KDF parameters**:

- **Auth KDF** (`auth_*`): Used for challenge-response authentication of the master password. The `auth_verifier_b64u` is a 32-byte HMAC key derived from the master password, stored server-side to verify identity without ever storing the master password itself.
- **Vault KDF** (`vault_*`): Parameters sent to the client so it can re-derive the AES-256-GCM vault key from the master password. The vault key is **never stored** on the server.

### AuthToken

Stores JWT refresh tokens. One user can have one active refresh token at a time (old tokens are deleted on each login). Used by `GET /auth/refresh_token` to issue new access tokens.

### Services

A catalog of service names (Gmail, GitHub, etc.) with optional icons. Created automatically when a user stores a password for a new service.

### Passwords

Stores **client-side encrypted** passwords. The `ciphertext_b64u` contains the AES-256-GCM encrypted password and the `iv_b64u` is the 12-byte initialization vector. Decryption happens exclusively on the client using the vault key derived from the master password.

### PasswordResetToken

Tracks account password reset requests. The `token` field stores a **SHA256 hash** of the actual reset token (the plaintext is sent via email). Tokens expire after 1 hour and are marked `used=True` after consumption.

## Relationships

| Relationship              | Type        | Cascade               |
| ------------------------- | ----------- | --------------------- |
| User → AuthToken          | One-to-Many | CASCADE DELETE        |
| User → Passwords          | One-to-Many | CASCADE DELETE        |
| User → PasswordResetToken | One-to-Many | CASCADE DELETE        |
| Services → Passwords      | One-to-Many | via `service_name` FK |
