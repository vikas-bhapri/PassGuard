import axios from "axios";

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1/",
    withCredentials: true, // Always send cookies with requests
})

// Add a request interceptor to include the token from Redux if available
instance.interceptors.request.use(
    (config) => {
        // Try to get token from localStorage (persisted Redux state)
        if (typeof window !== 'undefined') {
            try {
                const persistedState = localStorage.getItem('persist:root');
                if (persistedState) {
                    const parsedState = JSON.parse(persistedState);
                    if (parsedState.user) {
                        const userState = JSON.parse(parsedState.user);
                        if (userState.token) {
                            config.headers.Authorization = `Bearer ${userState.token}`;
                        }
                    }
                }
            } catch (error) {
                console.error('Error reading token from storage:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors (invalid/expired token)
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid or expired
            // Clear persisted state
            if (typeof window !== 'undefined') {
                localStorage.removeItem('persist:root');
            }
        }
        return Promise.reject(error);
    }
);

export default instance;