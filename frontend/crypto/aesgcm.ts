import { base64UrlToBuffer, bufferToBase64Url, dec, enc, randomBytes } from '@/utils/encoding';

export async function encryptString(
    plainText: string,
    aesKey: CryptoKey
) {
    const iv = randomBytes(12); // 96-bit IV for AES-GCM
    const ctBuff = await crypto.subtle.encrypt({name: "AES-GCM", iv}, aesKey, enc.encode(plainText)); // Cipher text buffer
    return {
        iv: bufferToBase64Url(iv),
        cipher_b64u: bufferToBase64Url(ctBuff)
    }
}

export async function decryptString(
    cipher_b64u: string,
    iv_b64u: string,
    aesKey: CryptoKey
) {
    const iv = base64UrlToBuffer(iv_b64u);
    const ctBuff = base64UrlToBuffer(cipher_b64u);
    const plainBuff = await crypto.subtle.decrypt({name: "AES-GCM", iv}, aesKey, ctBuff);
    return dec.decode(plainBuff);
}