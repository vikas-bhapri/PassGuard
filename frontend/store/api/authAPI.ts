import { hmac256Base64Url } from "@/crypto/hmac";
import { deriveAuthKey } from "@/crypto/kdf";
import instance from "@/utils/axios";
import {
  base64UrlToBuffer,
  bufferToBase64Url,
} from "@/utils/encoding";

interface MasterPasswordData {
  authSalt: ArrayBuffer;
  authKey: ArrayBuffer;
  vaultSalt: ArrayBuffer;
}

export const loginUserAPI = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await instance.post("auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data;
};

export const updateUserAPI = async (data: {
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
}) => {
    const response = await instance.patch("auth/", data, {
        headers: {
            "Content-Type": "application/json",
        }
    })
    return response.data;
};

export const deleteUserAPI = async (data: {
    password: string;
    confirm_delete: boolean;
}) => {
    const response = await instance.delete("auth/", {
        data: data,
        headers: {
            "Content-Type": "application/json",
        }
    })
    return response.data;
};

export const updateUserPasswordAPI = async (data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await instance.put("auth/update_password", data, {
    headers: {
      "Content-Type": "application/json",
    }
  })
  return response.data;
}

export const signUpUserAPI = async (data: {
  username: string;
  password: string;
  email: string;
  confirm_password: string;
}) => {
  const response = await instance.post("auth/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const getUserProfileAPI = async () => {
  const response = await instance.get("auth/");
  return response.data;
};

export const logoutAPI = async () => {
  const response = await instance.post("auth/logout");
  return response.data;
};

export const getKdfAPI = async () => {
  try {
    const response = await instance.get("auth/me/kdf");
    return response.data;
  } catch (error) {
    console.error("[API] getKdfAPI error:", error);
    throw error;
  }
};

export const refreshTokenAPI = async () => {
  // The refresh token is sent automatically via httpOnly cookies
  const response = await instance.get("auth/refresh_token");
  return response.data;
};

export const verifyVaultPasswordAPI = async (
  username: string,
  password: string,
) => {
  // Use challenge-response to verify the password without creating a new session
  // This calls the same endpoints as login but we use it only for verification
  const challengeResponse = await instance.get(
    `auth/login/challenge?username=${encodeURIComponent(username)}`,
  );
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
  );

  // This will throw an error if the password is wrong
  await instance.post(
    "auth/login/verify",
    {
      user_id: username,
      challenge_b64u: challenge_b64u,
      proof_b64u: proof,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );

  // If we get here, password is correct
  return { verified: true };
};

export const requestPasswordResetAPI = async (email: string) => {
  const response = await instance.post(
    `auth/password_reset_request?email=${encodeURIComponent(email)}`,
  );
  return response.data;
};

export const resetPasswordAPI = async (data: {
  new_password: string;
  confirm_password: string;
}, token: string) => {
  const response = await instance.post(
    "auth/reset_password?reset_token=" + encodeURIComponent(token),
    {
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

export const createMasterPasswordAPI = async (data: MasterPasswordData) => {
  const response = await instance.post("auth/master_password", {
    auth_algo: "PBKDF2-SHA256",
    auth_iterations: 125000,
    auth_salt_b64u: bufferToBase64Url(data.authSalt),
    auth_verifier_b64u: bufferToBase64Url(data.authKey),
    vault_kdf: {
      algo: "PBKDF2-SHA256",
      iterations: 125000,
      salt_b64u: bufferToBase64Url(data.vaultSalt),
    },
  });

  return response.data;
};
