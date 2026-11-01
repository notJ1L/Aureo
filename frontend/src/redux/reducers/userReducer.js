import {
    ADMIN_USERS_REQUEST,
    ADMIN_USERS_SUCCESS,
    ADMIN_USERS_FAIL,
    USER_CREATE_REQUEST,
    USER_CREATE_SUCCESS,
    USER_CREATE_FAIL,
    USER_CREATE_RESET,
    USER_UPDATE_REQUEST,
    USER_UPDATE_SUCCESS,
    USER_UPDATE_FAIL,
    USER_UPDATE_RESET,
    USER_DELETE_REQUEST,
    USER_DELETE_SUCCESS,
    USER_DELETE_FAIL,
    USER_DELETE_RESET,
    USER_BULK_DELETE_REQUEST,
    USER_BULK_DELETE_SUCCESS,
    USER_BULK_DELETE_FAIL,
    USER_BULK_DELETE_RESET,
    USER_CLEAR_ERRORS
} from "../constants/userConstants";

export const adminUsersReducer = (state = { users: [], loading: false }, action) => {
    switch (action.type) {
        case ADMIN_USERS_REQUEST:
            return { loading: true, users: [] };
        case ADMIN_USERS_SUCCESS:
            return { loading: false, users: action.payload };
        case ADMIN_USERS_FAIL:
            return { loading: false, error: action.payload, users: [] };
        case USER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const userMutationReducer = (state = {}, action) => {
    switch (action.type) {
        case USER_CREATE_REQUEST:
        case USER_UPDATE_REQUEST:
        case USER_DELETE_REQUEST:
        case USER_BULK_DELETE_REQUEST:
            return { loading: true };
        case USER_CREATE_SUCCESS:
            return { loading: false, success: true, user: action.payload };
        case USER_UPDATE_SUCCESS:
            return { loading: false, isUpdated: true, user: action.payload };
        case USER_DELETE_SUCCESS:
            return { loading: false, isDeleted: true };
        case USER_BULK_DELETE_SUCCESS:
            return { loading: false, isBulkDeleted: true };
        case USER_CREATE_FAIL:
        case USER_UPDATE_FAIL:
        case USER_DELETE_FAIL:
        case USER_BULK_DELETE_FAIL:
            return { loading: false, error: action.payload };
        case USER_CREATE_RESET:
        case USER_UPDATE_RESET:
        case USER_DELETE_RESET:
        case USER_BULK_DELETE_RESET:
            return {};
        case USER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
