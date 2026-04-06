import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { addPasswordAPI, deletePasswordAPI, getPasswordsAPI, updatePasswordAPI, PasswordPayload } from "@/store/api/passwordAPI";
import { getVaultKey } from "@/crypto/keyStore";
import { decryptString, encryptString } from "@/crypto/aesgcm";
import { RootState } from "../store";

type payload = {
    service: string;
    username: string;
    ciphertext_b64u: string;
    iv_b64u: string;
}

interface Password {
    id: string;
    payload: payload;
    created_at: string;
}

interface DecryptedPassword {
    id: string;
    service: string;
    username: string;
    password: string;
    created_at: string;
}

interface AddPasswordRequest {
    service: string;
    username: string;
    password: string;
}

interface PasswordState {
    passwords: DecryptedPassword[];
    loading: boolean;
    error: string | null;
}



export const fetchPasswords = createAsyncThunk(
    "passwords/fetch",
    async (_, {rejectWithValue}) => {
        try {
        const response = await getPasswordsAPI();
        const vaultKey = getVaultKey();

        if(!vaultKey) {
            return rejectWithValue("Vault key is not available. Cannot decrypt passwords.");
        }
        
        const decryptedPasswords = await Promise.all(
            response.map(async (entry: Password) => {
                const { id, created_at, payload } = entry;
                const decryptedPassword = await decryptString(
                    payload.ciphertext_b64u,
                    payload.iv_b64u,
                    vaultKey,
                )
                return {
                    id,
                    service: payload.service,
                    username: payload.username,
                    password: decryptedPassword,
                    created_at,
                }
            })
        )

        return decryptedPasswords;

        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to fetch passwords");
        }
    }
)

export const addPassword = createAsyncThunk(
    "passwords/add",
    async (data: AddPasswordRequest, {rejectWithValue, getState}) => {
    const passwordPlainText = data.password;
    const vaultKey = getVaultKey();
    const state = getState() as RootState;
    const kdfParams = state.kdf;

    if (!vaultKey) {
      throw new Error("Vault key is not available. Cannot encrypt password.");
    }

    const { iv, cipher_b64u } = await encryptString(
      passwordPlainText,
      vaultKey,
    );

    const payloadData = {
      payload: {
        service: data.service,
        username: data.username,
        ciphertext_b64u: cipher_b64u,
        iv_b64u: iv,
      },
      kdf: {
        algo: kdfParams.payload?.algo,
        ops_limit: kdfParams.payload?.ops_limit,
        mem_limit_kib: kdfParams.payload?.mem_limit_kib,
        salt_b64u: kdfParams.payload?.salt_b64u,
      },
    };
        try {
            const response = await addPasswordAPI(payloadData);
            return {
                id: response.id,
                service: data.service,
                username: data.username,
                password: passwordPlainText,
                created_at: response.created_at,
            };
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to add password");
        }
    }
)

export const deletePassword = createAsyncThunk(
    "passwords/delete",
    async (passwordId: string, {rejectWithValue}) => {
        try {
            const response = await deletePasswordAPI(passwordId);
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to delete password");
        }
    }
)

export const updatePassword = createAsyncThunk(
    "passwords/update",
    async ({ passwordId, data, plaintext }: { passwordId: string; data: PasswordPayload; plaintext: { service: string; username: string; password: string } }, {rejectWithValue}) => {
        try {
            const response = await updatePasswordAPI(passwordId, data);
            return {
                id: response.id,
                service: plaintext.service,
                username: plaintext.username,
                password: plaintext.password,
                created_at: response.created_at,
            };
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to update password");
        }
    })


const passwordSlice = createSlice({
    name: "passwords",
    initialState: {
        passwords: [],
        loading: false,
        error: null
    } as PasswordState,
    reducers: {
        clearPasswords: (state) => {
            state.passwords = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchPasswords.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.passwords = [];
        })
        .addCase(fetchPasswords.fulfilled, (state, action) => {
            state.loading = false;
            state.passwords = action.payload;
            state.error = null;
        })
        .addCase(fetchPasswords.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string | null })?.detail || "Failed to fetch passwords";
            state.passwords = [];
        })
        .addCase(addPassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addPassword.fulfilled, (state, action) => {
            state.loading = false;
            state.passwords.push(action.payload);
            state.error = null;
        })
        .addCase(addPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string | null })?.detail || "Failed to add password";
        })
        .addCase(deletePassword.pending, (state) => {
            state.loading = true;
        })
        .addCase(deletePassword.fulfilled, (state, action) => {
            state.loading = false;
            state.passwords = state.passwords.filter(p => p.id !== action.payload.id);
            state.error = null;
        })
        .addCase(deletePassword.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string | null })?.detail || "Failed to delete password";
        })
        .addCase(updatePassword.pending, (state) => {
            state.loading = true;
        })
        .addCase(updatePassword.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.passwords.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.passwords[index] = {
                    ...state.passwords[index],
                    ...action.payload,
                };
            }
        })
        .addCase(updatePassword.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string | null })?.detail || "Failed to update password";
        })
    }
})

export const { clearPasswords } = passwordSlice.actions;
export default passwordSlice.reducer;

