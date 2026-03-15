import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserProfileAPI, loginUserAPI, signUpUserAPI, logoutAPI, updateUserAPI, deleteUserAPI } from "../api/authAPI";
import { getReadToken } from "../api/storageAPI";

interface User {
    id: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    role?: string;
    new_user?: boolean;
    master_password_set?: boolean;
}

interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export const loginUser = createAsyncThunk(
    "user/login",
    async ({username, password}: {username: string, password: string}, {rejectWithValue}) => {
        try {
            const response = await loginUserAPI(username, password);
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Login failed");
        }
    }
)

export const signUpUser = createAsyncThunk(
    "user/signUp",
    async (data: { username: string, password: string, email: string, confirm_password: string }, {rejectWithValue}) => {
        try {
            const response = await signUpUserAPI(data);
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Sign up failed");
        }
    }
)

export const getUserProfile = createAsyncThunk(
    "user/getProfile",
    async (_, {rejectWithValue}) => {
        try {
            const response = await getUserProfileAPI();
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to fetch user profile");
        }
    }
)

export const logoutUser = createAsyncThunk(
    "user/logout",
    async (_, {rejectWithValue}) => {
        try {
            const response = await logoutAPI();
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Logout failed");
        }
    }
)

export const updateUserProfile = createAsyncThunk(
    "user/updateProfile",
    async (data: { first_name?: string; last_name?: string; image_url?: string }, {rejectWithValue}) => {
        try {            
            const response = await updateUserAPI(data);
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to update user profile");
        }
    }
)

export const deleteUserAccount = createAsyncThunk(
    "user/deleteAccount",
    async (data: {password: string; confirm_delete: boolean}, {rejectWithValue}) => {
        try {
            const response = await deleteUserAPI(data);
            return response;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to delete user account");
        }
    }
)

export const getProfilePicture = createAsyncThunk(
    "user/getProfilePic",
    async (_, {rejectWithValue}) => {
        try {
            const response = await getReadToken();
            return response.sas_url;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to fetch profile picture");
        }
    }
)


const userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
        loading: false,
        error: null,
    } as UserState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(loginUser.pending, (state) => {
            state.loading = true;
        })
        .addCase(loginUser.fulfilled, (state) => {
            state.loading = false;
            // Token is stored in httpOnly cookie by backend, no need to store here
            state.error = null;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to login";
        })
        .addCase(getUserProfile.pending, (state) => {
            state.loading = true;
        })
        .addCase(getUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.error = null;
        })
        .addCase(getUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to fetch user profile";
            state.user = null;
        })
        .addCase(logoutUser.pending, (state) => {
            state.loading = true;
        })
        .addCase(logoutUser.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.error = null;
        })
        .addCase(logoutUser.rejected, (state) => {
            state.loading = false;
            // Clear state even if logout API fails
            state.user = null;
            state.error = null;
        })
        .addCase(updateUserProfile.pending, (state) => {
            state.loading = true;
        })
        .addCase(updateUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.error = null;
        })
        .addCase(updateUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to update user profile";
        })
        .addCase(deleteUserAccount.pending, (state) => {
            state.loading = true;
        })
        .addCase(deleteUserAccount.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
        })
        .addCase(deleteUserAccount.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to delete user account";
        })
        .addCase(getProfilePicture.pending, (state) => {
            state.loading = true;
        })
        .addCase(getProfilePicture.fulfilled, (state, action) => {
            state.loading = false;
            state.user = state.user ? { ...state.user, image_url: action.payload } : null;
            state.error = null;
        })
        .addCase(getProfilePicture.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to fetch profile picture";
        })
    }
})

export default userSlice.reducer;