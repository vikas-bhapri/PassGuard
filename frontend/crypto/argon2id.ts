import { getSodium } from './sodium';

export async function argon2idRawKey(
    masterPassword: string,
    salt: ArrayBuffer,
    opsLimit?: number,
    memLimit?: number,
) {
    const sodium = await getSodium();
    
    // Set defaults after sodium is ready
    const ops = opsLimit ?? sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
    const mem = memLimit ?? sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
    
    return sodium.crypto_pwhash(
        32,
        masterPassword,
        new Uint8Array(salt),
        ops,
        mem,
        sodium.crypto_pwhash_ALG_ARGON2ID13
    )
}

export async function importAesGcmKey(raw32: Uint8Array) {
    // Create a new Uint8Array to ensure proper buffer type
    const buffer = new Uint8Array(raw32);
    
    return crypto.subtle.importKey(
        "raw",
        buffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    )
}