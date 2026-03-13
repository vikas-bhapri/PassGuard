"use client";

import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import kdfReducer from "./slices/kdfSlice";
import passwordReducer from "./slices/passwordSlice";

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['user'] // only persist the user slice
}

const rootReducer = combineReducers({
    user: userReducer,
    kdf: kdfReducer,
    passwords: passwordReducer,
})

export const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makePersistedStore = (store: any) => persistStore(store);