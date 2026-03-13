import instance from "@/utils/axios";

export interface PasswordPayload {
    service: string;
    username: string;
    ciphertext_b64u: string;
    iv_b64u: string;
}

interface KdfParams {
    algo?: string;
    iterations?: number;
    salt_b64u?: string;
}

interface AddPasswordRequest {
    payload: PasswordPayload;
    kdf: KdfParams;
}

export const addPasswordAPI = async (data: AddPasswordRequest) => {
    try {
        const response = await instance.post("passwords/", data, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        return response.data;
    } catch (error) {
        console.error('[API] addPasswordAPI error:', error);
        throw error;
    }
};

export const getPasswordsAPI = async () => {
    try {
        const response = await instance.get("passwords/");
        return response.data;
    } catch (error) {
        console.error('[API] getPasswordsAPI error:', error);
        throw error;
    }
};

export const deletePasswordAPI = async (passwordId: string) => {
    try {
        const response = await instance.delete(`passwords/${passwordId}`);
        return response.data;
    } catch (error) {
        console.error('[API] deletePasswordAPI error:', error);
        throw error;
    }
};

export const updatePasswordAPI = async (passwordId: string, data: PasswordPayload) => {
    try {
        const response = await instance.put(`passwords/${passwordId}`, data, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        return response.data;
    } catch (error) {
        console.error('[API] updatePasswordAPI error:', error);
        throw error;
    }
};
