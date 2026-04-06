# PassGuard — Sequence Diagrams

## 1. User Registration (Sign Up)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Fill sign-up form (username, email, password)
    Frontend->>Backend: POST /auth/ {username, email, password, confirm_password}
    Backend->>Backend: Validate input & hash password (bcrypt)
    Backend->>DB: INSERT User (new_user=True, master_password_set=False)
    DB-->>Backend: User record
    Backend-->>Frontend: 201 UserResponse {id, username, email}
    Frontend-->>User: Redirect to /sign-in
```

## 2. User Login (Account Password)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Enter username & password
    Frontend->>Redux: dispatch loginUser()
    Redux->>Backend: POST /auth/login (FormData: username, password)
    Backend->>DB: SELECT User WHERE username = ?
    DB-->>Backend: User record
    Backend->>Backend: Verify bcrypt password
    Backend->>Backend: Generate JWT access token (15 min)
    Backend->>Backend: Generate JWT refresh token (7 days)
    Backend->>DB: DELETE old AuthTokens for user
    Backend->>DB: INSERT AuthToken (refresh_token, expires_at)
    Backend-->>Redux: TokenResponse + Set-Cookie (access_token, refresh_token, httpOnly)
    Redux->>Redux: Update user state
    Redux-->>Frontend: Login success
    Frontend-->>User: Redirect to /welcome (new user) or /passwords
```

## 3. Create Master Password (First-Time Vault Setup)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Crypto as Crypto Module
    participant KeyStore as KeyStore (Memory)
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Enter master password on /welcome
    Frontend->>Crypto: Generate authSalt (16 bytes random)
    Frontend->>Crypto: Generate vaultSalt (16 bytes random)
    Frontend->>Crypto: deriveAuthKey(masterPassword, authSalt, 125000)
    Crypto-->>Frontend: authKey (32-byte HMAC key)
    Frontend->>Crypto: deriveVaultKey(masterPassword, vaultSalt, 125000)
    Crypto-->>Frontend: vaultKey (256-bit AES-GCM CryptoKey)
    Frontend->>KeyStore: setVaultKey(vaultKey)
    Frontend->>Backend: POST /auth/master_password {auth_algo, auth_iterations, auth_salt_b64u, auth_verifier_b64u, vault_algo, vault_iterations, vault_salt_b64u}
    Backend->>DB: UPDATE User SET auth/vault KDF params, master_password_set=True, new_user=False
    DB-->>Backend: Updated User
    Backend-->>Frontend: UserResponse
    Frontend-->>User: Redirect to /passwords (vault unlocked)
```

## 4. Unlock Vault (Challenge-Response Authentication)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Crypto as Crypto Module
    participant KeyStore as KeyStore (Memory)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Enter master password on locked vault screen

    Note over Frontend, Backend: Step 1 — Request Challenge
    Frontend->>Backend: GET /auth/login/challenge?username={username}
    Backend->>DB: SELECT User WHERE username = ?
    DB-->>Backend: User record
    Backend->>Backend: Generate challenge (32 bytes random)
    Backend->>Backend: Store challenge in challenge_store[username]
    Backend-->>Frontend: {challenge_b64u, auth_kdf, vault_kdf}

    Note over Frontend, Backend: Step 2 — Compute & Submit Proof
    Frontend->>Crypto: deriveAuthKey(masterPassword, auth_salt, auth_iterations)
    Crypto-->>Frontend: authKey (32 bytes)
    Frontend->>Crypto: hmac256Base64Url(authKey, challenge)
    Crypto-->>Frontend: proof_b64u
    Frontend->>Backend: POST /auth/login/verify {user_id, challenge_b64u, proof_b64u}
    Backend->>Backend: Pop challenge from challenge_store
    Backend->>DB: SELECT User.auth_verifier_b64u
    Backend->>Backend: Compute expected = HMAC-SHA256(auth_verifier, challenge)
    Backend->>Backend: hmac.compare_digest(expected, proof)
    Backend-->>Frontend: {status: "success"}

    Note over Frontend, KeyStore: Step 3 — Derive Vault Key & Decrypt
    Frontend->>Crypto: deriveVaultKey(masterPassword, vault_salt, vault_iterations)
    Crypto-->>Frontend: vaultKey (AES-GCM CryptoKey)
    Frontend->>KeyStore: setVaultKey(vaultKey)
    Frontend->>Redux: dispatch fetchPasswords()
    Redux->>Backend: GET /passwords/
    Backend->>DB: SELECT * FROM Passwords WHERE user_id = ?
    DB-->>Backend: Encrypted password records
    Backend-->>Redux: [{id, ciphertext_b64u, iv_b64u, service, username, ...}]
    Redux->>Crypto: decryptString(ciphertext_b64u, iv_b64u, vaultKey) for each
    Crypto-->>Redux: Plaintext passwords
    Redux-->>Frontend: Decrypted password list
    Frontend-->>User: Display unlocked passwords
```

## 5. Add Password

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Crypto as Crypto Module
    participant KeyStore as KeyStore (Memory)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Fill AddPasswordDialog (service, username, password)
    Frontend->>KeyStore: getVaultKey()
    KeyStore-->>Frontend: vaultKey (AES-GCM CryptoKey)
    Frontend->>Crypto: encryptString(password, vaultKey)
    Crypto->>Crypto: Generate random IV (12 bytes)
    Crypto->>Crypto: AES-GCM encrypt
    Crypto-->>Frontend: {iv_b64u, ciphertext_b64u}
    Frontend->>Redux: dispatch addPassword()
    Redux->>Backend: POST /passwords/ {service, username, ciphertext_b64u, iv_b64u}
    Backend->>DB: SELECT Service WHERE name = ? (create if not exists)
    Backend->>DB: INSERT Password {user_id, service_name, username, ciphertext_b64u, iv_b64u}
    DB-->>Backend: Password record
    Backend-->>Redux: PasswordItemOut
    Redux->>Redux: Append to passwords state
    Redux-->>Frontend: Password added
    Frontend-->>User: Show success toast & update list
```

## 6. Edit Password

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Crypto as Crypto Module
    participant KeyStore as KeyStore (Memory)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Click edit on PasswordCard → open EditPasswordDialog
    User->>Frontend: Modify fields (service, username, password)
    Frontend->>KeyStore: getVaultKey()
    KeyStore-->>Frontend: vaultKey
    Frontend->>Crypto: encryptString(newPassword, vaultKey)
    Crypto-->>Frontend: {iv_b64u, ciphertext_b64u}
    Frontend->>Redux: dispatch updatePassword()
    Redux->>Backend: PUT /passwords/{id} {service, username, ciphertext_b64u, iv_b64u}
    Backend->>DB: UPDATE Password SET fields WHERE id = ? AND user_id = ?
    DB-->>Backend: Updated record
    Backend-->>Redux: PasswordItemOut
    Redux->>Redux: Update password in state
    Redux-->>Frontend: Password updated
    Frontend-->>User: Show success toast
```

## 7. Delete Password

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Click delete on PasswordCard → confirm
    Frontend->>Redux: dispatch deletePassword(passwordId)
    Redux->>Backend: DELETE /passwords/{id}
    Backend->>DB: DELETE FROM Passwords WHERE id = ? AND user_id = ?
    DB-->>Backend: OK
    Backend-->>Redux: {id}
    Redux->>Redux: Remove password from state
    Redux-->>Frontend: Password deleted
    Frontend-->>User: Show success toast & update list
```

## 8. Token Refresh

```mermaid
sequenceDiagram
    participant Frontend as Frontend (Next.js)
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    Frontend->>Backend: GET /auth/refresh_token (Cookie: refresh_token)
    Backend->>Backend: Decode JWT refresh token (verify signature, issuer, audience)
    Backend->>Backend: Verify type == "refresh"
    Backend->>DB: SELECT AuthToken WHERE token = ?
    DB-->>Backend: Token record
    Backend->>Backend: Check token not expired
    Backend->>Backend: Generate new access token (15 min)
    Backend-->>Frontend: TokenResponse + Set-Cookie (new access_token)
```

## 9. Password Reset (Forgot Password)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL
    participant Email as Email Service

    Note over User, Email: Step 1 — Request Reset Link
    User->>Frontend: Enter email on /forgot-password
    Frontend->>Backend: POST /auth/password_reset_request?email={email}
    Backend->>DB: SELECT User WHERE email = ?
    DB-->>Backend: User record
    Backend->>Backend: Generate reset_token (32 bytes urlsafe)
    Backend->>Backend: hash = SHA256(reset_token)
    Backend->>DB: INSERT PasswordResetToken {user_id, token=hash, expires_at=now+1h, used=False}
    Backend->>Email: Send email with link: /reset-password?token={plain_token}
    Backend-->>Frontend: {detail: "If this email exists, a reset link has been sent"}

    Note over User, Email: Step 2 — Reset Password
    User->>Frontend: Click link in email → /reset-password?token={token}
    User->>Frontend: Enter new password & confirm
    Frontend->>Backend: POST /auth/reset_password?reset_token={token} {new_password, confirm_password}
    Backend->>Backend: hash = SHA256(token)
    Backend->>DB: SELECT PasswordResetToken WHERE token = hash
    DB-->>Backend: Reset token record
    Backend->>Backend: Validate: not expired, not used
    Backend->>Backend: Hash new password (bcrypt)
    Backend->>DB: UPDATE User SET hashed_password = ?
    Backend->>DB: UPDATE PasswordResetToken SET used = True
    Backend-->>Frontend: {detail: "Password reset successful"}
    Frontend-->>User: Redirect to /sign-in
```

## 10. Reset Master Password (Re-encrypt All Passwords)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Crypto as Crypto Module
    participant KeyStore as KeyStore (Memory)
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Open ResetMasterPassword dialog
    User->>Frontend: Enter old master password & new master password

    Note over Frontend, Backend: Verify old master password
    Frontend->>Backend: GET /auth/login/challenge?username={username}
    Backend-->>Frontend: {challenge_b64u, auth_kdf, vault_kdf}
    Frontend->>Crypto: deriveAuthKey(oldPassword, auth_salt, iterations)
    Frontend->>Crypto: hmac256Base64Url(authKey, challenge)
    Frontend->>Backend: POST /auth/login/verify {proof_b64u}
    Backend-->>Frontend: {status: "success"}

    Note over Frontend, Crypto: Derive old & new keys
    Frontend->>Crypto: deriveVaultKey(oldPassword, old_vault_salt, iterations)
    Crypto-->>Frontend: oldVaultKey
    Frontend->>Crypto: Generate new authSalt, vaultSalt
    Frontend->>Crypto: deriveAuthKey(newPassword, newAuthSalt, 125000)
    Crypto-->>Frontend: newAuthKey
    Frontend->>Crypto: deriveVaultKey(newPassword, newVaultSalt, 125000)
    Crypto-->>Frontend: newVaultKey

    Note over Frontend, DB: Re-encrypt all passwords
    Frontend->>Backend: GET /passwords/
    Backend-->>Frontend: [{ciphertext_b64u, iv_b64u, ...}]
    loop For each password
        Frontend->>Crypto: decryptString(ciphertext, iv, oldVaultKey)
        Crypto-->>Frontend: plaintext
        Frontend->>Crypto: encryptString(plaintext, newVaultKey)
        Crypto-->>Frontend: {new_iv_b64u, new_ciphertext_b64u}
        Frontend->>Backend: PUT /passwords/{id} {new ciphertext & iv}
        Backend->>DB: UPDATE Password
    end

    Note over Frontend, DB: Update KDF params
    Frontend->>Backend: POST /auth/master_password {new auth & vault KDF params}
    Backend->>DB: UPDATE User SET new auth/vault params
    Backend-->>Frontend: UserResponse
    Frontend->>KeyStore: setVaultKey(newVaultKey)
    Frontend-->>User: Success — master password changed
```

## 11. Upload Profile Picture (Azure Blob Storage)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant Backend as Backend (FastAPI)
    participant Azure as Azure Blob Storage

    User->>Frontend: Select profile picture file
    Frontend->>Backend: POST /storage/profile-upload {content_type, content_length}
    Backend->>Backend: Validate file type & size (<5MB)
    Backend->>Backend: Generate blob path: users/{username}/profile_{uuid}.{ext}
    Backend->>Azure: Generate SAS URL (PUT permission, 5 min expiry)
    Azure-->>Backend: SAS URL
    Backend-->>Frontend: {sas_url, blob_url, expires_at}
    Frontend->>Azure: PUT {sas_url} (x-ms-blob-type: BlockBlob, body: file bytes)
    Azure-->>Frontend: 201 Created
    Frontend->>Backend: PATCH /auth/ {image_url: blob_url}
    Backend->>Backend: Update user record
    Backend-->>Frontend: UserResponse
    Frontend-->>User: Profile picture updated
```

## 12. Lock Vault

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant KeyStore as KeyStore (Memory)
    participant Redux as Redux Store

    User->>Frontend: Click "Lock Vault" button
    Frontend->>KeyStore: clearVaultKey()
    KeyStore->>KeyStore: vaultKey = null
    Frontend->>Redux: dispatch clearPasswords()
    Redux->>Redux: passwords = []
    Frontend-->>User: Display locked vault screen
```

## 13. Logout

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (Next.js)
    participant KeyStore as KeyStore (Memory)
    participant Redux as Redux Store
    participant Backend as Backend (FastAPI)
    participant DB as PostgreSQL

    User->>Frontend: Click Logout
    Frontend->>Redux: dispatch logoutUser()
    Redux->>Backend: POST /auth/logout (Cookie: access_token)
    Backend->>Backend: Validate JWT token
    Backend->>DB: DELETE AuthTokens WHERE user_id = ?
    Backend-->>Redux: {message: "Logged out"} + Clear cookies
    Redux->>Redux: Clear user state
    Frontend->>KeyStore: clearVaultKey()
    Frontend-->>User: Redirect to /sign-in
```
