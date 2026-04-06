import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getKdfAPI } from "../api/authAPI";
import { base64UrlToBuffer } from "@/utils/encoding";
import { setVaultKey as storeVaultKey, clearVaultKey as clearStoredVaultKey } from "@/crypto/keyStore";
import type { RootState } from "../store";
import { AxiosError } from "axios";
import { argon2idRawKey, importAesGcmKey } from "@/crypto/argon2id";

interface KdfParams {
    algo?: string;
    ops_limit?: number;
    mem_limit_kib?: number;
    salt_b64u?: string;
}

interface KdfResponse {
    vault_kdf: KdfParams;
}

interface KdfState {
    payload: KdfParams | null;
    loading: boolean;
    error: string | null;
    hasVaultKey: boolean;
}

export const getKdfParams = createAsyncThunk(
    "kdf/getParams",
    async (_, {rejectWithValue}) => {
        try {
            const response: KdfResponse = await getKdfAPI();
            return response.vault_kdf;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data || "Failed to fetch KDF parameters");
            }
            return rejectWithValue((error as Error).message || "Failed to fetch KDF parameters");
        }
    }
)

export const deriveAndSetVaultKey = createAsyncThunk(
    "kdf/deriveVaultKey",
    async ({ masterPassword, username }: { masterPassword: string; username: string }, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const { payload } = state.kdf;
            
            if (!payload?.salt_b64u || !payload?.ops_limit || !payload?.mem_limit_kib) {
                return rejectWithValue("KDF parameters not available. Please fetch them first.");
            }
            
            // Verify password using challenge-response authentication
            // This will throw an error if the password is incorrect
            const { verifyVaultPasswordAPI } = await import("../api/authAPI");
            
            try {
                await verifyVaultPasswordAPI(username, masterPassword);
            } catch (error) {
                console.error("Vault password verification failed:", error);
                return rejectWithValue("Incorrect master password. Please try again.");
            }
            
            // Password is verified, now derive the vault key
            const vaultSalt = base64UrlToBuffer(payload.salt_b64u);
            const vaultRaw = await argon2idRawKey(
                    masterPassword,
                    vaultSalt,
                    payload.ops_limit,
                    payload.mem_limit_kib,
                  );
            const vaultKey = await importAesGcmKey(vaultRaw);
            
            // Store key in memory, not in Redux
            storeVaultKey(vaultKey);
            
            return true;
        } catch (error: unknown) {
            console.error("Error deriving vault key:", error);
            return rejectWithValue((error as Error).message || "Failed to derive vault key");
        }
    }
)

const kdfSlice = createSlice({
    name: "kdf",
    initialState: {
        payload: null,
        loading: false,
        error: null,
        hasVaultKey: false
    } as KdfState,
    reducers: {
        clearVaultKey: (state) => {
            clearStoredVaultKey();
            state.hasVaultKey = false;
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(getKdfParams.fulfilled, (state, action) => {
            state.payload = action.payload;
            state.loading = false;
            state.error = null;
        })
        .addCase(getKdfParams.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getKdfParams.rejected, (state, action) => {
            state.loading = false;
            const payload = action.payload as { detail?: string } | string | undefined;
            state.error = (typeof payload === 'string' ? payload : payload?.detail) || "Failed to fetch KDF parameters";
            state.payload = null;
        })
        .addCase(deriveAndSetVaultKey.fulfilled, (state) => {
            state.hasVaultKey = true;
            state.loading = false;
            state.error = null;
        })
        .addCase(deriveAndSetVaultKey.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deriveAndSetVaultKey.rejected, (state, action) => {
            state.loading = false;
            const payload = action.payload as { message?: string } | string | undefined;
            state.error = (typeof payload === 'string' ? payload : payload?.message) || "Failed to derive vault key";
            clearStoredVaultKey();
            state.hasVaultKey = false;
        })
    }
})

export const { clearVaultKey } = kdfSlice.actions;
export default kdfSlice.reducer;