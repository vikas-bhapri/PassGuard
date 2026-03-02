"use client";

import { configureStore } from "@reduxjs/toolkit";

import { persistedReducer, makePersistedStore } from "./persistStore";

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }),
})

export const persistor = makePersistedStore(store);