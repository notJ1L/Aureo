import api from "../../services/api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import getSupabase from "../../config/supabase";
import {
    AUTH_REGISTER_REQUEST, AUTH_REGISTER_SUCCESS, AUTH_REGISTER_FAIL,
    AUTH_VERIFY_REQUEST,   AUTH_VERIFY_SUCCESS,   AUTH_VERIFY_FAIL,
    AUTH_LOGIN_REQUEST,    AUTH_LOGIN_SUCCESS,    AUTH_LOGIN_FAIL,
    AUTH_GOOGLE_REQUEST,   AUTH_GOOGLE_SUCCESS,    AUTH_GOOGLE_FAIL,
    AUTH_LOAD_USER_REQUEST, AUTH_LOAD_USER_SUCCESS, AUTH_LOAD_USER_FAIL,
    AUTH_UPDATE_PROFILE_REQUEST, AUTH_UPDATE_PROFILE_SUCCESS, AUTH_UPDATE_PROFILE_FAIL,
    AUTH_UPLOAD_AVATAR_REQUEST,  AUTH_UPLOAD_AVATAR_SUCCESS,  AUTH_UPLOAD_AVATAR_FAIL,
    AUTH_LOGOUT,
    AUTH_CLEAR_ERROR
} from "../constants/authConstants";

const SUPABASE_ERROR_MESSAGES = {
    "User already registered": "Email is already registered",
    "Invalid login credentials": "Invalid email or password",
    "Email not confirmed": "Please verify your email before signing in",
    "Token has expired or is invalid": "Invalid or expired verification code"
};

const translateSupabaseError = (error) => {
    const raw = error?.message || "Authentication failed";

    return SUPABASE_ERROR_MESSAGES[raw] || raw;
};

// FR 1.1: Register the Supabase identity first, then link it to the Aureo
// profile. The password never reaches the Aureo backend.
export const registerUser = ({ name, email, password }) => async (dispatch) => {
    dispatch({ type: AUTH_REGISTER_REQUEST });
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) {
            // An identity that already exists in Supabase is not a hard
            // failure here, the backend links it to the Aureo profile.
            const isAlreadyRegistered =
                error?.code === "email_exists" ||
                /already|registered|exists/i.test(error?.message || "");

            if (!isAlreadyRegistered) {
                throw new Error(translateSupabaseError(error));
            }
        }

        const { data: response } = await api.post("/register", {
            name,
            email,
            supabaseUserId: data?.user?.id
        });

        dispatch({ type: AUTH_REGISTER_SUCCESS, payload: response.email });
    } catch (err) {
        dispatch({
            type: AUTH_REGISTER_FAIL,
            payload: err.response?.data?.message || err.message || "Registration failed"
        });
    }
};

// FR 1.5: Verify the 6-digit code with Supabase, then let the backend confirm
// the verification state on the Aureo profile.
export const verifyEmail = (email, code) => async (dispatch) => {
    dispatch({ type: AUTH_VERIFY_REQUEST });
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: "email"
        });

        if (!error && data?.session) {
            const { data: response } = await api.post("/verify-email", {
                email,
                accessToken: data.session.access_token
            });

            dispatch({ type: AUTH_VERIFY_SUCCESS, payload: response.message });
            return;
        }

        // The backend validates the code against Supabase first and then
        // against the Aureo fallback code, so the flow still completes when
        // the Supabase email template is not set to a 6 digit code.
        const { data: response } = await api.post("/verify-email", { email, code });

        dispatch({ type: AUTH_VERIFY_SUCCESS, payload: response.message });
    } catch (err) {
        dispatch({
            type: AUTH_VERIFY_FAIL,
            payload: err.response?.data?.message || err.message || "Verification failed"
        });
    }
};

// FR 1.1: Sign in with the Supabase identity, then exchange the Supabase
// session for the Aureo Bearer JWT.
export const loginUser = (email, password) => async (dispatch) => {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        let accessToken = data?.session?.access_token;

        if (error || !accessToken) {
            // Fall back to backend authentication: handles local accounts (e.g. seeded
            // administrator), unconfirmed accounts, and accounts managed server-side.
            try {
                const { data: response } = await api.post("/login", { email, password });

                localStorage.setItem("aureoToken", response.token);
                dispatch({ type: AUTH_LOGIN_SUCCESS, payload: response.user });
                return;
            } catch (backendErr) {
                const message =
                    backendErr.response?.data?.message ||
                    translateSupabaseError(error) ||
                    "Invalid email or password";
                throw new Error(message);
            }
        }

        const { data: response } = await api.post("/login", {
            email,
            accessToken
        });

        localStorage.setItem("aureoToken", response.token);
        dispatch({ type: AUTH_LOGIN_SUCCESS, payload: response.user });
    } catch (err) {
        dispatch({
            type: AUTH_LOGIN_FAIL,
            payload: err.response?.data?.message || err.message || "Login failed"
        });
    }
};

// FR 1.1 / Quiz 4: Google sign-in via Firebase -> backend JWT
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
