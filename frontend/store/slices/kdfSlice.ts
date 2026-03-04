import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getKdfAPI } from "../api/authAPI";
import { deriveVaultKey } from "@/crypto/kdf";
import { base64UrlToBuffer } from "@/utils/encoding";
import { setVaultKey as storeVaultKey, clearVaultKey as clearStoredVaultKey } from "@/crypto/keyStore";
import type { RootState } from "../store";

interface KdfParams {
    algo?: string;
    iterations?: number;
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
            console.log("Fetched KDF params:", response);
            return response.vault_kdf;
        } catch (error: unknown) {
            const errorObj = error as any;
            return rejectWithValue(errorObj.response?.data || "Failed to fetch KDF parameters");
        }
    }
)

export const deriveAndSetVaultKey = createAsyncThunk(
    "kdf/deriveVaultKey",
    async (masterPassword: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const { payload } = state.kdf;
            
            console.log("KDF payload:", payload);
            
            if (!payload?.salt_b64u || !payload?.iterations) {
                return rejectWithValue("KDF parameters not available. Please fetch them first.");
            }
            
            const vaultSalt = base64UrlToBuffer(payload.salt_b64u);
            console.log("Deriving vault key with iterations:", payload.iterations);
            
            const key = await deriveVaultKey(masterPassword, vaultSalt, payload.iterations);
            
            console.log("Vault key derived:", key);
            console.log("Key type:", key.constructor.name);
            console.log("Key algorithm:", key.algorithm);
            
            // Store key in memory, not in Redux
            storeVaultKey(key);
            
            return true;
        } catch (error: unknown) {
            const errorObj = error as any;
            console.error("Error deriving vault key:", errorObj);
            return rejectWithValue(errorObj.message || "Failed to derive vault key");
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
            state.error = (typeof action.payload === 'string' ? action.payload : (action.payload as any)?.detail) || "Failed to fetch KDF parameters";
            state.payload = null;
        })
        .addCase(deriveAndSetVaultKey.fulfilled, (state) => {
            console.log("Vault key stored successfully");
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
            state.error = (typeof action.payload === 'string' ? action.payload : (action.payload as any)?.message) || "Failed to derive vault key";
            clearStoredVaultKey();
            state.hasVaultKey = false;
        })
    }
})

export const { clearVaultKey } = kdfSlice.actions;
export default kdfSlice.reducer;