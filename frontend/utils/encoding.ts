export const enc = new TextEncoder();
export const dec = new TextDecoder();

export const bufferToBase64Url = (buffer: ArrayBuffer) : string => {
    const bytes = new Uint8Array(buffer);
    let str = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const base64UrlToBuffer = (base64Url: string) : ArrayBuffer => {
    const b64 = base64Url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((base64Url.length + 3) % 4);
  const str = atob(b64);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf.buffer;
}


export function randomBytes(len = 16): ArrayBuffer {
  const u8 = new Uint8Array(len);
  crypto.getRandomValues(u8);
  return u8.buffer;
}
