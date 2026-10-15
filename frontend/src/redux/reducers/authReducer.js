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

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    // separate loading flag for profile/avatar updates
    updateLoading: false,
    error: null,
    // post-register flow
    registeredEmail: null,
    verified: false
};

export const authReducer = (state = initialState, action) => {
    switch (action.type) {

        // Loading states
        case AUTH_REGISTER_REQUEST:
        case AUTH_VERIFY_REQUEST:
        case AUTH_LOGIN_REQUEST:
        case AUTH_GOOGLE_REQUEST:
        case AUTH_LOAD_USER_REQUEST:
            return { ...state, loading: true, error: null };

        case AUTH_UPDATE_PROFILE_REQUEST:
        case AUTH_UPLOAD_AVATAR_REQUEST:
            return { ...state, updateLoading: true, error: null };

        // Register success → save email for verify step
        case AUTH_REGISTER_SUCCESS:
            return { ...state, loading: false, registeredEmail: action.payload };

        // Verify success
        case AUTH_VERIFY_SUCCESS:
            return { ...state, loading: false, verified: true };

        // Login / Google / Load user success
        case AUTH_LOGIN_SUCCESS:
        case AUTH_GOOGLE_SUCCESS:
        case AUTH_LOAD_USER_SUCCESS:
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                user: action.payload,
                error: null
            };

        // Profile update success
        case AUTH_UPDATE_PROFILE_SUCCESS:
            return {
                ...state,
                updateLoading: false,
                user: action.payload
            };

        // Avatar update success
        case AUTH_UPLOAD_AVATAR_SUCCESS:
            return {
                ...state,
                updateLoading: false,
                user: { ...state.user, avatar: action.payload }
            };

        // Failures
        case AUTH_REGISTER_FAIL:
        case AUTH_VERIFY_FAIL:
        case AUTH_LOGIN_FAIL:
        case AUTH_GOOGLE_FAIL:
            return { ...state, loading: false, error: action.payload };

        case AUTH_LOAD_USER_FAIL:
            return { ...state, loading: false, isAuthenticated: false, user: null };

        case AUTH_UPDATE_PROFILE_FAIL:
        case AUTH_UPLOAD_AVATAR_FAIL:
            return { ...state, updateLoading: false, error: action.payload };

        // Logout
        case AUTH_LOGOUT:
            return { ...initialState };

        // Clear error
        case AUTH_CLEAR_ERROR:
            return { ...state, error: null };

        default:
            return state;
    }
};
