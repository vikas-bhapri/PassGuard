# PassGuard — User Flow Diagram

## Complete Application User Flow

```mermaid
flowchart TD
    Start([User Opens App]) --> AuthCheck{Authenticated?}

    %% ── Unauthenticated flows ──
    AuthCheck -- No --> AuthLayout[Auth Layout]
    AuthLayout --> SignIn["/sign-in<br/>Login Form"]
    AuthLayout --> SignUp["/sign-up<br/>Registration Form"]
    AuthLayout --> ForgotPW["/forgot-password<br/>Email Form"]
    AuthLayout --> ResetPW["/reset-password?token=...<br/>New Password Form"]

    SignIn -- "Don't have account?" --> SignUp
    SignUp -- "Already have account?" --> SignIn
    SignIn -- "Forgot password?" --> ForgotPW

    SignUp -- "Submit (username, email, password)" --> SignUpAPI["POST /auth/<br/>Create Account"]
    SignUpAPI -- Success --> SignIn

    ForgotPW -- "Submit email" --> ResetReqAPI["POST /auth/password_reset_request<br/>Send Reset Email"]
    ResetReqAPI --> EmailSent["Email Sent<br/>(with reset link)"]
    EmailSent -- "Click link in email" --> ResetPW
    ResetPW -- "Submit new password" --> ResetAPI["POST /auth/reset_password<br/>Update Password"]
    ResetAPI -- Success --> SignIn

    SignIn -- "Submit (username, password)" --> LoginAPI["POST /auth/login<br/>JWT Tokens + Cookies"]
    LoginAPI -- Invalid credentials --> SignIn

    %% ── Post-login routing ──
    LoginAPI -- Success --> NewUserCheck{New User?}
    AuthCheck -- Yes --> NewUserCheck
    NewUserCheck -- Yes --> Welcome
    NewUserCheck -- No --> Passwords

    %% ── Welcome / Master Password Setup ──
    Welcome["/welcome<br/>Welcome Page"]
    Welcome --> CreateMP["Create Master Password Dialog"]
    CreateMP -- "Enter master password" --> DeriveKeys["Client-Side Key Derivation<br/>• authSalt + authKey (PBKDF2)<br/>• vaultSalt + vaultKey (PBKDF2)"]
    DeriveKeys --> StoreVaultKey["Store vaultKey in Memory<br/>(KeyStore)"]
    StoreVaultKey --> SendKDF["POST /auth/master_password<br/>(auth & vault KDF params)"]
    SendKDF -- Success --> Passwords

    %% ── Passwords Page (Vault) ──
    Passwords["/passwords<br/>Password Vault"]
    Passwords --> VaultLocked{Vault Key<br/>in Memory?}

    %% ── Vault Locked ──
    VaultLocked -- No --> LockScreen["Locked Screen<br/>Enter Master Password"]
    LockScreen -- "Submit master password" --> ChallengeReq["GET /auth/login/challenge<br/>Receive challenge + KDF params"]
    ChallengeReq --> DeriveAuth["Derive authKey<br/>(PBKDF2 with auth_salt)"]
    DeriveAuth --> SignChallenge["HMAC-SHA256 sign challenge"]
    SignChallenge --> VerifyProof["POST /auth/login/verify<br/>Submit proof_b64u"]
    VerifyProof -- Invalid --> LockScreen
    VerifyProof -- Valid --> DeriveVault["Derive vaultKey<br/>(PBKDF2 with vault_salt)"]
    DeriveVault --> StoreKey["Store vaultKey in Memory"]
    StoreKey --> FetchPW["GET /passwords/<br/>Fetch encrypted passwords"]
    FetchPW --> DecryptAll["Decrypt each password<br/>AES-256-GCM with vaultKey"]
    DecryptAll --> VaultUnlocked

    %% ── Vault Unlocked ──
    VaultLocked -- Yes --> VaultUnlocked["Unlocked Vault<br/>Password List"]

    VaultUnlocked --> AddPW["Add Password"]
    VaultUnlocked --> EditPW["Edit Password"]
    VaultUnlocked --> DeletePW["Delete Password"]
    VaultUnlocked --> CopyPW["Copy Password to Clipboard"]
    VaultUnlocked --> RevealPW["Reveal / Hide Password"]
    VaultUnlocked --> LockVault["Lock Vault"]
    VaultUnlocked --> GoAccount["Go to Account"]
    VaultUnlocked --> Logout["Logout"]

    AddPW --> AddDialog["AddPasswordDialog<br/>(service, username, password)"]
    AddDialog -- "Submit" --> EncryptNew["Encrypt password<br/>AES-GCM + random IV"]
    EncryptNew --> PostPW["POST /passwords/<br/>{ciphertext_b64u, iv_b64u}"]
    PostPW --> VaultUnlocked

    EditPW --> EditDialog["EditPasswordDialog<br/>(modify fields)"]
    EditDialog -- "Submit" --> ReEncrypt["Re-encrypt password<br/>AES-GCM + new IV"]
    ReEncrypt --> PutPW["PUT /passwords/{id}<br/>{new ciphertext & iv}"]
    PutPW --> VaultUnlocked

    DeletePW --> ConfirmDel["Confirm Deletion"]
    ConfirmDel -- "Yes" --> DelPW["DELETE /passwords/{id}"]
    DelPW --> VaultUnlocked

    LockVault --> ClearKey["Clear vaultKey from Memory<br/>Clear passwords from State"]
    ClearKey --> VaultLocked

    %% ── Account Page ──
    GoAccount --> Account["/account/[id]<br/>Account Settings"]
    Account --> UpdateProfile["Update Profile<br/>(first name, last name)"]
    Account --> UploadPic["Upload Profile Picture"]
    Account --> ChangeAccPW["Change Account Password"]
    Account --> ChangeMasterPW["Reset Master Password"]
    Account --> DeleteAccount["Delete Account"]

    UpdateProfile --> PatchUser["PATCH /auth/<br/>{first_name, last_name}"]
    PatchUser --> Account

    UploadPic --> GetSAS["POST /storage/profile-upload<br/>Get SAS URL"]
    GetSAS --> UploadBlob["PUT to Azure Blob<br/>(direct upload via SAS)"]
    UploadBlob --> UpdateImg["PATCH /auth/<br/>{image_url: blob_url}"]
    UpdateImg --> Account

    ChangeAccPW --> AccPWForm["Enter old & new password"]
    AccPWForm --> PutAccPW["PUT /auth/update_password/<br/>{old_password, new_password}"]
    PutAccPW --> Account

    ChangeMasterPW --> MPDialog["Enter old & new master password"]
    MPDialog --> VerifyOld["Verify old master password<br/>(challenge-response)"]
    VerifyOld -- Invalid --> MPDialog
    VerifyOld -- Valid --> ReEncryptAll["Derive new keys<br/>Decrypt all with old key<br/>Re-encrypt all with new key"]
    ReEncryptAll --> UpdateKDF["POST /auth/master_password<br/>(new KDF params)"]
    UpdateKDF --> Account

    DeleteAccount --> DelAccForm["Enter password + confirm"]
    DelAccForm --> DelAcc["DELETE /auth/<br/>{password, confirm_delete}"]
    DelAcc --> SignIn

    %% ── Logout ──
    Logout --> LogoutAPI["POST /auth/logout<br/>Clear cookies & tokens"]
    LogoutAPI --> ClearState["Clear user state<br/>Clear vaultKey from Memory"]
    ClearState --> SignIn

    %% ── Styling ──
    classDef page fill:#4A90D9,stroke:#2C5F8A,color:#fff
    classDef action fill:#5CB85C,stroke:#3D8B3D,color:#fff
    classDef api fill:#F0AD4E,stroke:#C87F0A,color:#000
    classDef crypto fill:#D9534F,stroke:#A94442,color:#fff
    classDef decision fill:#fff,stroke:#333,color:#000

    class SignIn,SignUp,ForgotPW,ResetPW,Welcome,Passwords,Account page
    class AddDialog,EditDialog,ConfirmDel,AccPWForm,MPDialog,DelAccForm,LockScreen,CreateMP action
    class SignUpAPI,LoginAPI,ResetReqAPI,ResetAPI,PostPW,PutPW,DelPW,PatchUser,GetSAS,PutAccPW,DelAcc,LogoutAPI,SendKDF,ChallengeReq,VerifyProof,FetchPW,UpdateKDF api
    class DeriveKeys,StoreVaultKey,EncryptNew,ReEncrypt,DeriveAuth,SignChallenge,DeriveVault,StoreKey,DecryptAll,ClearKey,ReEncryptAll,VerifyOld crypto
```

## Legend

| Color     | Meaning                  |
| --------- | ------------------------ |
| 🔵 Blue   | Pages / Views            |
| 🟢 Green  | User Actions / Dialogs   |
| 🟡 Yellow | API Calls                |
| 🔴 Red    | Cryptographic Operations |
| ⬜ White  | Decision Points          |
