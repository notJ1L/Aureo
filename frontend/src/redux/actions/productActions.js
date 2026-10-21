import api from "../../services/api";
import {
    PRODUCT_LIST_REQUEST, PRODUCT_LIST_SUCCESS, PRODUCT_LIST_FAIL,
    PRODUCT_DETAILS_REQUEST, PRODUCT_DETAILS_SUCCESS, PRODUCT_DETAILS_FAIL,
    ADMIN_PRODUCT_LIST_REQUEST, ADMIN_PRODUCT_LIST_SUCCESS, ADMIN_PRODUCT_LIST_FAIL,
    PRODUCT_CREATE_REQUEST, PRODUCT_CREATE_SUCCESS, PRODUCT_CREATE_FAIL,
    PRODUCT_UPDATE_REQUEST, PRODUCT_UPDATE_SUCCESS, PRODUCT_UPDATE_FAIL,
    PRODUCT_DELETE_REQUEST, PRODUCT_DELETE_SUCCESS, PRODUCT_DELETE_FAIL,
    WISHLIST_GET_REQUEST, WISHLIST_GET_SUCCESS, WISHLIST_GET_FAIL,
    WISHLIST_TOGGLE_REQUEST, WISHLIST_TOGGLE_SUCCESS, WISHLIST_TOGGLE_FAIL,
    PRODUCT_CLEAR_ERRORS
} from "../constants/productConstants";

export const getProducts = (params = {}) => async (dispatch) => {
    dispatch({ type: PRODUCT_LIST_REQUEST });
    try {
        const { data } = await api.get("/products", { params });
        dispatch({
            type: PRODUCT_LIST_SUCCESS,
            payload: data
        });
    } catch (err) {
        dispatch({
            type: PRODUCT_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load products"
        });
    }
};

export const getProductDetails = (id) => async (dispatch) => {
    dispatch({ type: PRODUCT_DETAILS_REQUEST });
    try {
        const { data } = await api.get(`/product/${id}`);
        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data.product
        });
    } catch (err) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: err.response?.data?.message || "Failed to load product details"
        });
    }
};

export const getAdminProducts = () => async (dispatch) => {
    dispatch({ type: ADMIN_PRODUCT_LIST_REQUEST });
    try {
        const { data } = await api.get("/admin/products");
        dispatch({
            type: ADMIN_PRODUCT_LIST_SUCCESS,
            payload: data.products
        });
    } catch (err) {
        dispatch({
            type: ADMIN_PRODUCT_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load admin products"
        });
    }
};

export const createProduct = (productData) => async (dispatch) => {
    dispatch({ type: PRODUCT_CREATE_REQUEST });
    try {
        const { data } = await api.post("/admin/product/new", productData);
        dispatch({
            type: PRODUCT_CREATE_SUCCESS,
            payload: data.product
        });
    } catch (err) {
        dispatch({
            type: PRODUCT_CREATE_FAIL,
            payload: err.response?.data?.message || "Failed to create product"
        });
    }
};

export const updateProduct = (id, productData) => async (dispatch) => {
    dispatch({ type: PRODUCT_UPDATE_REQUEST });
    try {
        const { data } = await api.put(`/admin/product/${id}`, productData);
        dispatch({
            type: PRODUCT_UPDATE_SUCCESS,
            payload: data.product
        });
    } catch (err) {
        dispatch({
            type: PRODUCT_UPDATE_FAIL,
            payload: err.response?.data?.message || "Failed to update product"
        });
    }
};

export const deleteProduct = (id) => async (dispatch) => {
    dispatch({ type: PRODUCT_DELETE_REQUEST });
    try {
        const { data } = await api.delete(`/admin/product/${id}`);
        dispatch({
            type: PRODUCT_DELETE_SUCCESS,
            payload: { id, message: data.message }
        });
    } catch (err) {
        dispatch({
            type: PRODUCT_DELETE_FAIL,
            payload: err.response?.data?.message || "Failed to delete product"
        });
    }
};

export const getWishlist = () => async (dispatch) => {
    dispatch({ type: WISHLIST_GET_REQUEST });
    try {
        const { data } = await api.get("/wishlist");
        dispatch({
            type: WISHLIST_GET_SUCCESS,
            payload: data.wishlist
        });
    } catch (err) {
        dispatch({
            type: WISHLIST_GET_FAIL,
            payload: err.response?.data?.message || "Failed to load wishlist"
        });
    }
};

export const addToWishlist = (productId) => async (dispatch) => {
    dispatch({ type: WISHLIST_TOGGLE_REQUEST });
    try {
        const { data } = await api.post(`/wishlist/${productId}`);
        dispatch({
            type: WISHLIST_TOGGLE_SUCCESS,
            payload: data.wishlist
        });
    } catch (err) {
        dispatch({
            type: WISHLIST_TOGGLE_FAIL,
            payload: err.response?.data?.message || "Failed to add to wishlist"
        });
    }
};

export const removeFromWishlist = (productId) => async (dispatch) => {
    dispatch({ type: WISHLIST_TOGGLE_REQUEST });
    try {
        const { data } = await api.delete(`/wishlist/${productId}`);
        dispatch({
            type: WISHLIST_TOGGLE_SUCCESS,
            payload: data.wishlist
        });
    } catch (err) {
        dispatch({
            type: WISHLIST_TOGGLE_FAIL,
            payload: err.response?.data?.message || "Failed to remove from wishlist"
        });
    }
};

export const clearProductErrors = () => ({ type: PRODUCT_CLEAR_ERRORS });
