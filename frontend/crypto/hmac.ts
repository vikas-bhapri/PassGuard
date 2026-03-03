import { bufferToBase64Url } from '@/utils/encoding';

export async function hmac256Base64Url(
    keyRaw: ArrayBuffer,
    message: ArrayBuffer
) : Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        keyRaw,
        {name: "HMAC", hash: "SHA-256"},
        false,
        ["sign"]
    )

    const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        message
    )

    return bufferToBase64Url(sig);
}

