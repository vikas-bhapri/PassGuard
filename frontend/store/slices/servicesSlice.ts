import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { fetchServicesAPI, createServiceAPI, deleteServiceAPI } from "../api/servicesAPI";
import { getServiceImageUploadSasAPI, uploadFileAPI } from "../api/storageAPI";

interface Service {
    id: string;
    name: string;
    image_url: string;
}

interface ServicesState {
    services: Service[];
    loading: boolean;
    error: string | null;
}

export const fetchServices = createAsyncThunk(
    "services/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchServicesAPI();
            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
)

export const addService = createAsyncThunk(
    "services/add",
    async (data: {name: string, file: File | null}, {rejectWithValue}) => {
        try {
            const sasResponse = await getServiceImageUploadSasAPI({
                content_type: data.file?.type || "",
                content_length: data.file?.size || 0,
                service_name: data.name,
            });

            const sasUrl = sasResponse.sas_url;

            if (data.file) {
                await uploadFileAPI(sasUrl, data.file);
            }

            const response = await createServiceAPI(
                {name: data.name, image_url: sasUrl.split("?")[0]}
            );
            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
)

export const deleteService = createAsyncThunk(
    "services/delete",
    async (serviceId: string, {rejectWithValue}) => {
        try {
            const response = await deleteServiceAPI(serviceId);
            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
)

const serviceSlice = createSlice({
    name: "services",
    initialState: {
        services: [],
        loading: false,
        error: null,
    } as ServicesState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(fetchServices.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchServices.fulfilled, (state, action) => {
            state.loading = false;
            state.services = action.payload
        })
        .addCase(fetchServices.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to fetch services";
        })
        .addCase(addService.pending, (state) => {
            state.loading = true;
        })
        .addCase(addService.fulfilled, (state, action) => {
            state.loading = false;
            state.services.push(action.payload);
        })
        .addCase(addService.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to add service";
        })
        .addCase(deleteService.pending, (state) => {
            state.loading = true;
        })
        .addCase(deleteService.fulfilled, (state, action) => {
            state.loading = false;
            state.services = state.services.filter(service => service.id !== action.meta.arg);
        })
        .addCase(deleteService.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as { detail?: string })?.detail || "Failed to delete service";
        })
    }
})

export default serviceSlice.reducer;