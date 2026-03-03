import { hmac256Base64Url } from "@/crypto/hmac";
import { deriveAuthKey } from "@/crypto/kdf";
import instance from "@/utils/axios";
import { base64UrlToBuffer } from "@/utils/encoding";

export const loginUserAPI = async (username: string, password: string) => {
    const challengeResponse = await instance.get(`auth/login/challenge?username=${encodeURIComponent(username)}`);
    const challengeResult = challengeResponse.data;

    const { challenge_b64u, auth_kdf } = challengeResult;

    const authSalt = base64UrlToBuffer(auth_kdf.salt_b64u);
    const authKeyRaw = await deriveAuthKey(
        password,
        authSalt,
        auth_kdf.iterations,
    );

    const proof = await hmac256Base64Url(
        authKeyRaw,
        base64UrlToBuffer(challenge_b64u),
    )

    const verifyResponse = await instance.post("auth/login/verify", {
        user_id: username,
        challenge_b64u: challenge_b64u,
        proof_b64u: proof,
    },
    {
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    })

    return verifyResponse.data;
}

export const signUpUserAPI = async (data: { username: string, password: string, email: string, confirm_password: string }) => {
    const response = await instance.post("auth/", data, {
        headers: {
            "Content-Type": "application/json",
        }
    })
    return response.data;
}

export const getUserProfileAPI = async () => {
    const response = await instance.get("auth/");
    return response.data;
}

export const logoutAPI = async () => {
    const response = await instance.post("auth/logout");
    return response.data;
}