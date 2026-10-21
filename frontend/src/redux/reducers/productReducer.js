import {
    PRODUCT_LIST_REQUEST, PRODUCT_LIST_SUCCESS, PRODUCT_LIST_FAIL,
    PRODUCT_DETAILS_REQUEST, PRODUCT_DETAILS_SUCCESS, PRODUCT_DETAILS_FAIL,
    ADMIN_PRODUCT_LIST_REQUEST, ADMIN_PRODUCT_LIST_SUCCESS, ADMIN_PRODUCT_LIST_FAIL,
    PRODUCT_CREATE_REQUEST, PRODUCT_CREATE_SUCCESS, PRODUCT_CREATE_FAIL, PRODUCT_CREATE_RESET,
    PRODUCT_UPDATE_REQUEST, PRODUCT_UPDATE_SUCCESS, PRODUCT_UPDATE_FAIL, PRODUCT_UPDATE_RESET,
    PRODUCT_DELETE_REQUEST, PRODUCT_DELETE_SUCCESS, PRODUCT_DELETE_FAIL, PRODUCT_DELETE_RESET,
    PRODUCT_BULK_DELETE_REQUEST, PRODUCT_BULK_DELETE_SUCCESS, PRODUCT_BULK_DELETE_FAIL, PRODUCT_BULK_DELETE_RESET,
    WISHLIST_GET_REQUEST, WISHLIST_GET_SUCCESS, WISHLIST_GET_FAIL,
    WISHLIST_TOGGLE_REQUEST, WISHLIST_TOGGLE_SUCCESS, WISHLIST_TOGGLE_FAIL,
    PRODUCT_CLEAR_ERRORS
} from "../constants/productConstants";

export const productListReducer = (state = { products: [], pagination: {} }, action) => {
    switch (action.type) {
        case PRODUCT_LIST_REQUEST:
            return { ...state, loading: true };
        case PRODUCT_LIST_SUCCESS:
            return {
                loading: false,
                products: action.payload.products,
                pagination: action.payload.pagination,
                error: null
            };
        case PRODUCT_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        case PRODUCT_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const productDetailsReducer = (state = { product: null }, action) => {
    switch (action.type) {
        case PRODUCT_DETAILS_REQUEST:
            return { ...state, loading: true };
        case PRODUCT_DETAILS_SUCCESS:
            return { loading: false, product: action.payload, error: null };
        case PRODUCT_DETAILS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case PRODUCT_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const wishlistReducer = (state = { wishlist: [] }, action) => {
    switch (action.type) {
        case WISHLIST_GET_REQUEST:
        case WISHLIST_TOGGLE_REQUEST:
            return { ...state, loading: true };
        case WISHLIST_GET_SUCCESS:
        case WISHLIST_TOGGLE_SUCCESS:
            return { loading: false, wishlist: action.payload, error: null };
        case WISHLIST_GET_FAIL:
        case WISHLIST_TOGGLE_FAIL:
            return { ...state, loading: false, error: action.payload };
        case PRODUCT_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const adminProductsReducer = (state = { products: [] }, action) => {
    switch (action.type) {
        case ADMIN_PRODUCT_LIST_REQUEST:
            return { ...state, loading: true };
        case ADMIN_PRODUCT_LIST_SUCCESS:
            return { loading: false, products: action.payload, error: null };
        case ADMIN_PRODUCT_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        case PRODUCT_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const productMutationReducer = (state = {}, action) => {
    switch (action.type) {
        case PRODUCT_CREATE_REQUEST:
        case PRODUCT_UPDATE_REQUEST:
        case PRODUCT_DELETE_REQUEST:
        case PRODUCT_BULK_DELETE_REQUEST:
            return { loading: true };
        case PRODUCT_CREATE_SUCCESS:
            return { loading: false, success: true, createdProduct: action.payload };
        case PRODUCT_UPDATE_SUCCESS:
            return { loading: false, isUpdated: true, updatedProduct: action.payload };
        case PRODUCT_DELETE_SUCCESS:
            return { loading: false, isDeleted: true, message: action.payload.message };
        case PRODUCT_BULK_DELETE_SUCCESS:
            return {
                loading: false,
                isBulkDeleted: true,
                message: action.payload.message,
                deleted: action.payload.deleted,
                deactivated: action.payload.deactivated
            };
        case PRODUCT_CREATE_FAIL:
        case PRODUCT_UPDATE_FAIL:
        case PRODUCT_DELETE_FAIL:
        case PRODUCT_BULK_DELETE_FAIL:
            return { loading: false, error: action.payload };
        case PRODUCT_CREATE_RESET:
        case PRODUCT_UPDATE_RESET:
        case PRODUCT_DELETE_RESET:
        case PRODUCT_BULK_DELETE_RESET:
            return {};
        case PRODUCT_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
