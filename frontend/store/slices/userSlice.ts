import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserProfileAPI, loginUserAPI, signUpUserAPI } from "../api/authAPI";

export const loginUser = createAsyncThunk(
    "user/login",
    async ({username, password}: {username: string, password: string}, {rejectWithValue}) => {
        try {
            const response = await loginUserAPI(username, password);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Login failed");
        }
    }
)

export const signUpUser = createAsyncThunk(
    "user/signUp",
    async (data: { username: string, password: string, email: string, confirm_password: string }, {rejectWithValue}) => {
        try {
            const response = await signUpUserAPI(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Sign up failed");
        }
    }
)

export const getUserProfile = createAsyncThunk(
    "user/getProfile",
    async (_, {rejectWithValue}) => {
        try {
            const response = await getUserProfileAPI();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to fetch user profile");
        }
    }
)


const userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(loginUser.pending, (state) => {
            state.loading = true;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.token = action.payload.access_token;
            state.error = null;
        })
        .addCase(loginUser.rejected, (state, action: any) => {
            state.loading = false;
            state.error = action.payload?.detail || "Failed to login";
            state.token = null;
        })
        .addCase(getUserProfile.pending, (state) => {
            state.loading = true;
        })
        .addCase(getUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.error = null;
        })
        .addCase(getUserProfile.rejected, (state, action: any) => {
            state.loading = false;
            state.error = action.payload?.detail || "Failed to fetch user profile";
            state.user = null;
        })
    }
})

export const { logout } = userSlice.actions;

export default userSlice.reducer;