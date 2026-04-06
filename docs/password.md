# Password Management

PassGuard allows the user to store and manage their passwords in one place so they don't forget them. The password management follows Zero-Knowledge principle in the server-side. Where the server will not know the passwords and keys. All the encryption and decryption happens on the client-side. And the server only stores the encrypted data.

## Algorithms

PassGuard uses the PBKDF2-SHA256 encryption algorithm for the master key and the AES-GCM encryption algorithms for the passwords.

### PBKDF2-SHA256 [(Code)](./../frontend/crypto/kdf.ts)

This algorithm is used to encrypt/decrypt the master key created by the user. Which then is used to encrypt/decrypt the passwords. This method is used to generate two keys,

1. Auth Key: This is used to verify the master password entered. This is stored in the database.
2. Vault Key: This is used to manage the user's passwords. This is not stored in the database. This will be created in the client's side and stored in memory

### AES-GCM [(Code)](./../frontend/crypto/aesgcm.ts)

This algorithm is used to generate the vault key. Which is used to manage passwords. **Note:** If you forget the master password, it is not possible to retrieve the passwords. So please be careful.

### HMAC [(Code)](./../frontend/crypto/hmac.ts)

This is used to verify the challenge that is sent to the client. The challenge is then converted to a HMAC sign which is then compared with the clients HMAC sign. If successful, the server responds with a success code to the client to unlock the vault.

## Flow

1. User logs in to the application. Gets the access_token and refresh_token.
2. User unlocks the Vault with his master password.
3. The client sends the /challenge request and gets the challenge in base64 format. Then client uses HMAC to sign the challenge and sends it as proof to authenticate.
4. The server then compares HMAC with it's own that was created by using auth_key. On success, it response with a success code.
5. Now, the vault is unlocked and vault key is stored in the memory.
6. Using the vault key, the passwords can be managed.
