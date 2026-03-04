import { enc } from "@/utils/encoding";

// Derive a key for HMAC from password via PBKDF2-SHA256
export async function deriveAuthKey(
    masterPassword: string,
    salt: ArrayBuffer,
    iterations: number = 125_000
) : Promise<ArrayBuffer> {
    const passKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(masterPassword),
        {name: "PBKDF2"},
        false,
        ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
        {name: "PBKDF2", salt, iterations, hash: "SHA-256"},
        passKey,
        256
    );

    return bits;
}

// Derive a AES-GCM key for vault encryption from password via PBKDF2-SHA256
export async function deriveVaultKey(
    masterPassword: string,
    salt: ArrayBuffer,
    iterations: number = 100_000
) : Promise<CryptoKey> {
    const passKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(masterPassword),
        {name: "PBKDF2"},
        false,
        ["deriveKey"]
    )

    return crypto.subtle.deriveKey(
        {name: "PBKDF2", salt, iterations, hash: "SHA-256"},
        passKey,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]
    )
}
