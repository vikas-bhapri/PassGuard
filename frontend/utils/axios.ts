import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1/",
    withCredentials: true, // Always send cookies with requests (including httpOnly cookies)
})

// Queue to hold pending requests while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason: Error | AxiosError) => void;
}> = [];

const processQueue = (error: Error | AxiosError | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Add a request interceptor to log requests (for debugging)
instance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors and refresh tokens
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            
            // Don't retry token refresh for these endpoints to avoid infinite loops or incorrect behavior
            const skipRefreshUrls = ['auth/refresh_token', 'auth/login', 'auth/login/verify', 'auth/logout'];
            const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest.url?.includes(url));
            
            if (shouldSkipRefresh) {
                // For login/auth endpoints, 401 means invalid credentials, not expired token
                // Just reject without redirecting
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        // Retry with the new access token cookie set by the refresh call
                        return instance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh token endpoint
                // The refresh token is automatically sent via httpOnly cookie
                // The new access token is automatically set as a httpOnly cookie by the backend
                await instance.get('auth/refresh_token');

                // Process queued requests - they will now use the new access token cookie
                processQueue(null);
                isRefreshing = false;

                // Retry the original request with the new access token cookie
                return instance(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear auth state and redirect to login
                console.error('[Axios Interceptor] Token refresh failed:', refreshError);
                const error = refreshError instanceof Error ? refreshError : new Error('Token refresh failed');
                processQueue(error);
                isRefreshing = false;

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('persist:root');
                    window.location.href = '/sign-in';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;