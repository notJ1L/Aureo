import api from "../../services/api";
import {
    ADMIN_USERS_REQUEST,
    ADMIN_USERS_SUCCESS,
    ADMIN_USERS_FAIL,
    USER_CREATE_REQUEST,
    USER_CREATE_SUCCESS,
    USER_CREATE_FAIL,
    USER_UPDATE_REQUEST,
    USER_UPDATE_SUCCESS,
    USER_UPDATE_FAIL,
    USER_DELETE_REQUEST,
    USER_DELETE_SUCCESS,
    USER_DELETE_FAIL,
    USER_BULK_DELETE_REQUEST,
    USER_BULK_DELETE_SUCCESS,
    USER_BULK_DELETE_FAIL,
    USER_CLEAR_ERRORS
} from "../constants/userConstants";

export const getAdminUsers = () => async (dispatch) => {
    dispatch({ type: ADMIN_USERS_REQUEST });
    try {
        const { data } = await api.get("/admin/users");
        dispatch({
            type: ADMIN_USERS_SUCCESS,
            payload: data.users || []
        });
    } catch (err) {
        dispatch({
            type: ADMIN_USERS_FAIL,
            payload: err.response?.data?.message || "Failed to load users"
        });
    }
};

export const createUser = (userData) => async (dispatch) => {
    dispatch({ type: USER_CREATE_REQUEST });
    try {
        const { data } = await api.post("/admin/users", userData);
        dispatch({
            type: USER_CREATE_SUCCESS,
            payload: data.user
        });
    } catch (err) {
        dispatch({
            type: USER_CREATE_FAIL,
            payload: err.response?.data?.message || "Failed to create user"
        });
    }
};

export const updateUser = (id, userData) => async (dispatch) => {
    dispatch({ type: USER_UPDATE_REQUEST });
    try {
        const { data } = await api.put(`/admin/user/${id}`, userData);
        dispatch({
            type: USER_UPDATE_SUCCESS,
            payload: data.user
        });
    } catch (err) {
        dispatch({
            type: USER_UPDATE_FAIL,
            payload: err.response?.data?.message || "Failed to update user"
        });
    }
};

export const deleteUser = (id) => async (dispatch) => {
    dispatch({ type: USER_DELETE_REQUEST });
    try {
        await api.delete(`/admin/user/${id}`);
        dispatch({ type: USER_DELETE_SUCCESS });
    } catch (err) {
        dispatch({
            type: USER_DELETE_FAIL,
            payload: err.response?.data?.message || "Failed to delete user"
        });
    }
};

export const bulkDeleteUsers = (ids) => async (dispatch) => {
    dispatch({ type: USER_BULK_DELETE_REQUEST });
    try {
        await api.post("/admin/users/bulk-delete", { ids });
        dispatch({ type: USER_BULK_DELETE_SUCCESS });
    } catch (err) {
        dispatch({
            type: USER_BULK_DELETE_FAIL,
            payload: err.response?.data?.message || "Failed to delete selected users"
        });
    }
};

export const clearErrors = () => (dispatch) => {
    dispatch({ type: USER_CLEAR_ERRORS });
};
