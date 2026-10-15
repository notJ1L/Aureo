import api from "../../services/api";
import {
    ORDER_CREATE_REQUEST, ORDER_CREATE_SUCCESS, ORDER_CREATE_FAIL,
    MY_ORDERS_REQUEST, MY_ORDERS_SUCCESS, MY_ORDERS_FAIL,
    ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL,
    ORDER_CANCEL_REQUEST, ORDER_CANCEL_SUCCESS, ORDER_CANCEL_FAIL,
    ADMIN_ORDERS_REQUEST, ADMIN_ORDERS_SUCCESS, ADMIN_ORDERS_FAIL,
    ORDER_CLEAR_ERRORS
} from "../constants/orderConstants";

export const createOrder = (orderData) => async (dispatch) => {
    dispatch({ type: ORDER_CREATE_REQUEST });
    try {
        const { data } = await api.post("/order/new", orderData);
        dispatch({ type: ORDER_CREATE_SUCCESS, payload: data.order });
    } catch (err) {
        dispatch({
            type: ORDER_CREATE_FAIL,
            payload: err.response?.data?.message || "Order placement failed"
        });
    }
};

export const getMyOrders = () => async (dispatch) => {
    dispatch({ type: MY_ORDERS_REQUEST });
    try {
        const { data } = await api.get("/orders/me");
        dispatch({ type: MY_ORDERS_SUCCESS, payload: data.orders });
    } catch (err) {
        dispatch({
            type: MY_ORDERS_FAIL,
            payload: err.response?.data?.message || "Failed to load orders"
        });
    }
};

export const getOrderDetails = (id) => async (dispatch) => {
    dispatch({ type: ORDER_DETAILS_REQUEST });
    try {
        const { data } = await api.get(`/order/${id}`);
        dispatch({ type: ORDER_DETAILS_SUCCESS, payload: data.order });
    } catch (err) {
        dispatch({
            type: ORDER_DETAILS_FAIL,
            payload: err.response?.data?.message || "Failed to load order details"
        });
    }
};

export const cancelOrder = (id) => async (dispatch) => {
    dispatch({ type: ORDER_CANCEL_REQUEST });
    try {
        const { data } = await api.put(`/order/${id}/cancel`);
        dispatch({ type: ORDER_CANCEL_SUCCESS, payload: data.order });
    } catch (err) {
        dispatch({
            type: ORDER_CANCEL_FAIL,
            payload: err.response?.data?.message || "Failed to cancel order"
        });
    }
};

export const getAdminOrders = () => async (dispatch) => {
    dispatch({ type: ADMIN_ORDERS_REQUEST });
    try {
        const { data } = await api.get("/admin/orders");
        dispatch({ type: ADMIN_ORDERS_SUCCESS, payload: data.orders });
    } catch (err) {
        dispatch({
            type: ADMIN_ORDERS_FAIL,
            payload: err.response?.data?.message || "Failed to load admin orders"
        });
    }
};

export const clearOrderErrors = () => ({ type: ORDER_CLEAR_ERRORS });
