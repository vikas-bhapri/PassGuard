import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getToDoListAPI } from "../api/todoAPI";

export interface Todo {
    id: string;
    title: string;
    description: string;
    is_completed: boolean;
    complete_by: Date;
}

interface ToDoState {
    todos: Todo[];
    upcomingTodos: Todo[];
    delayedTodos: Todo[];
    loading: boolean;
    error: string | null;
}

export const fetchToDoList = createAsyncThunk(
    "todo/fetchList",
    async ({ page, limit, sort, date }: { page?: number; limit?: number; sort?: string; date?: string }, { rejectWithValue }) => {
        try {
            const response = await getToDoListAPI({ page, limit, sort, date });
            if (response.status === "success") {
                return response.data;
            }
            throw new Error("Failed to fetch To Do list");
        } catch (error) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to fetch lists");
        }
    }
)

export const fetchUpcomingToDoList = createAsyncThunk(
    "todo/fetchUpcomingList",
    async ({ page, limit, sort, date }: { page?: number; limit?: number; sort?: string; date?: string }, { rejectWithValue }) => {
        try {
            const response = await getToDoListAPI({ page, limit, sort, date });
            if (response.status === "success") {
                return response.data;
            }
            throw new Error("Failed to fetch upcoming To Do list");
        } catch (error) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to fetch lists");
        }
    }
)

export const fetchDelayedToDoList = createAsyncThunk(
    "todo/fetchDelayedList",
    async ({ page, limit, sort, date, is_completed = false }: { page?: number; limit?: number; sort?: string; date?: string; is_completed?: boolean }, { rejectWithValue }) => {
        try {
            const response = await getToDoListAPI({ page, limit, sort, date, is_completed });
            if (response.status === "success") {
                return response.data;
            }
            throw new Error("Failed to fetch delayed To Do list");
        } catch (error) {
            const axiosError = error as { response?: { data?: unknown } };
            return rejectWithValue(axiosError.response?.data || "Failed to fetch lists");
        }
    }
)

const todoSlice = createSlice({
    name: "todo",
    initialState: {
        todos: [],
        upcomingTodos: [],
        delayedTodos: [],
        loading: false,
        error: null
     } as ToDoState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchToDoList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchToDoList.fulfilled, (state, action) => {
                state.loading = false;
                state.todos = action.payload.filter((todo: Todo) => new Date(todo.complete_by) <= new Date());
            })
            .addCase(fetchToDoList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchUpcomingToDoList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUpcomingToDoList.fulfilled, (state, action) => {
                state.loading = false;
                state.upcomingTodos = action.payload;
            })
            .addCase(fetchUpcomingToDoList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchDelayedToDoList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDelayedToDoList.fulfilled, (state, action) => {
                state.loading = false;
                state.delayedTodos = action.payload.filter((todo: Todo) => new Date(todo.complete_by) < new Date());
            })
            .addCase(fetchDelayedToDoList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
})

export default todoSlice.reducer;

