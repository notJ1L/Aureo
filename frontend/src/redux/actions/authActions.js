import api from "../../services/api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import {
    AUTH_REGISTER_REQUEST, AUTH_REGISTER_SUCCESS, AUTH_REGISTER_FAIL,
    AUTH_VERIFY_REQUEST,   AUTH_VERIFY_SUCCESS,   AUTH_VERIFY_FAIL,
    AUTH_LOGIN_REQUEST,    AUTH_LOGIN_SUCCESS,     AUTH_LOGIN_FAIL,
    AUTH_GOOGLE_REQUEST,   AUTH_GOOGLE_SUCCESS,    AUTH_GOOGLE_FAIL,
    AUTH_LOAD_USER_REQUEST, AUTH_LOAD_USER_SUCCESS, AUTH_LOAD_USER_FAIL,
    AUTH_UPDATE_PROFILE_REQUEST, AUTH_UPDATE_PROFILE_SUCCESS, AUTH_UPDATE_PROFILE_FAIL,
    AUTH_UPLOAD_AVATAR_REQUEST,  AUTH_UPLOAD_AVATAR_SUCCESS,  AUTH_UPLOAD_AVATAR_FAIL,
    AUTH_LOGOUT,
    AUTH_CLEAR_ERROR
} from "../constants/authConstants";

// Register
export const registerUser = (formData) => async (dispatch) => {
    dispatch({ type: AUTH_REGISTER_REQUEST });
    try {
        const { data } = await api.post("/register", formData);
        dispatch({ type: AUTH_REGISTER_SUCCESS, payload: data.email });
    } catch (err) {
        dispatch({
            type: AUTH_REGISTER_FAIL,
            payload: err.response?.data?.message || "Registration failed"
        });
    }
};

// Verify email code
export const verifyEmail = (email, code) => async (dispatch) => {
    dispatch({ type: AUTH_VERIFY_REQUEST });
    try {
        const { data } = await api.post("/verify-email", { email, code });
        dispatch({ type: AUTH_VERIFY_SUCCESS, payload: data.message });
    } catch (err) {
        dispatch({
            type: AUTH_VERIFY_FAIL,
            payload: err.response?.data?.message || "Verification failed"
        });
    }
};

// Email/password login
export const loginUser = (email, password) => async (dispatch) => {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    try {
        const { data } = await api.post("/login", { email, password });
        localStorage.setItem("aureoToken", data.token);
        dispatch({ type: AUTH_LOGIN_SUCCESS, payload: data.user });
    } catch (err) {
        dispatch({
            type: AUTH_LOGIN_FAIL,
            payload: err.response?.data?.message || "Login failed"
        });
    }
};

// Google sign-in via Firebase → backend JWT
export const googleLogin = () => async (dispatch) => {
    dispatch({ type: AUTH_GOOGLE_REQUEST });
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        const { data } = await api.post("/auth/google", { idToken });
        localStorage.setItem("aureoToken", data.token);
        dispatch({ type: AUTH_GOOGLE_SUCCESS, payload: data.user });
    } catch (err) {
        dispatch({
            type: AUTH_GOOGLE_FAIL,
            payload: err.response?.data?.message || "Google sign-in failed"
        });
    }
};

// Load current user from token
export const loadUser = () => async (dispatch) => {
    dispatch({ type: AUTH_LOAD_USER_REQUEST });
    try {
        const { data } = await api.get("/me");
        dispatch({ type: AUTH_LOAD_USER_SUCCESS, payload: data.user });
    } catch {
        dispatch({ type: AUTH_LOAD_USER_FAIL });
    }
};

// Update profile
export const updateProfile = (formData) => async (dispatch) => {
    dispatch({ type: AUTH_UPDATE_PROFILE_REQUEST });
    try {
        const { data } = await api.put("/me/update", formData);
        dispatch({ type: AUTH_UPDATE_PROFILE_SUCCESS, payload: data.user });
    } catch (err) {
        dispatch({
            type: AUTH_UPDATE_PROFILE_FAIL,
            payload: err.response?.data?.message || "Profile update failed"
        });
    }
};

// Upload avatar (base64)
export const uploadAvatar = (base64Image) => async (dispatch) => {
    dispatch({ type: AUTH_UPLOAD_AVATAR_REQUEST });
    try {
        const { data } = await api.put("/me/avatar", { avatar: base64Image });
        dispatch({ type: AUTH_UPLOAD_AVATAR_SUCCESS, payload: data.avatar });
    } catch (err) {
        dispatch({
            type: AUTH_UPLOAD_AVATAR_FAIL,
            payload: err.response?.data?.message || "Avatar upload failed"
        });
    }
};

// Logout
export const logoutUser = () => async (dispatch) => {
    try {
        await api.get("/logout");
    } finally {
        localStorage.removeItem("aureoToken");
        dispatch({ type: AUTH_LOGOUT });
    }
};

// Clear error
export const clearAuthError = () => ({ type: AUTH_CLEAR_ERROR });
