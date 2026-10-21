import {
    ORDER_CREATE_REQUEST, ORDER_CREATE_SUCCESS, ORDER_CREATE_FAIL, ORDER_CREATE_RESET,
    MY_ORDERS_REQUEST, MY_ORDERS_SUCCESS, MY_ORDERS_FAIL,
    ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL,
    ORDER_CANCEL_REQUEST, ORDER_CANCEL_SUCCESS, ORDER_CANCEL_FAIL,
    ADMIN_ORDERS_REQUEST, ADMIN_ORDERS_SUCCESS, ADMIN_ORDERS_FAIL,
    ADMIN_ORDER_UPDATE_REQUEST, ADMIN_ORDER_UPDATE_SUCCESS, ADMIN_ORDER_UPDATE_FAIL,
    ADMIN_ORDER_DELETE_REQUEST, ADMIN_ORDER_DELETE_SUCCESS, ADMIN_ORDER_DELETE_FAIL,
    ORDER_CLEAR_ERRORS
} from "../constants/orderConstants";

export const orderCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_CREATE_REQUEST:
            return { loading: true };
        case ORDER_CREATE_SUCCESS:
            return { loading: false, success: true, order: action.payload };
        case ORDER_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CREATE_RESET:
            return {};
        case ORDER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const myOrdersReducer = (state = { orders: [] }, action) => {
    switch (action.type) {
        case MY_ORDERS_REQUEST:
            return { loading: true, orders: [] };
        case MY_ORDERS_SUCCESS:
            return { loading: false, orders: action.payload };
        case MY_ORDERS_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const orderDetailsReducer = (state = { order: null }, action) => {
    switch (action.type) {
        case ORDER_DETAILS_REQUEST:
            return { loading: true };
        case ORDER_DETAILS_SUCCESS:
            return { loading: false, order: action.payload };
        case ORDER_DETAILS_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const orderCancelReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_CANCEL_REQUEST:
            return { loading: true };
        case ORDER_CANCEL_SUCCESS:
            return { loading: false, isCancelled: true, cancelledOrder: action.payload };
        case ORDER_CANCEL_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const adminOrderMutationReducer = (state = {}, action) => {
    switch (action.type) {
        case ADMIN_ORDER_UPDATE_REQUEST:
        case ADMIN_ORDER_DELETE_REQUEST:
            return { loading: true };
        case ADMIN_ORDER_UPDATE_SUCCESS:
            return { loading: false, isUpdated: true, updatedOrder: action.payload };
        case ADMIN_ORDER_DELETE_SUCCESS:
            return {
                loading: false,
                isDeleted: true,
                message: action.payload.message
            };
        case ADMIN_ORDER_UPDATE_FAIL:
        case ADMIN_ORDER_DELETE_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const adminOrdersReducer = (state = { orders: [] }, action) => {
    switch (action.type) {
        case ADMIN_ORDERS_REQUEST:
            return { loading: true, orders: [] };
        case ADMIN_ORDERS_SUCCESS:
            return { loading: false, orders: action.payload };
        case ADMIN_ORDERS_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
