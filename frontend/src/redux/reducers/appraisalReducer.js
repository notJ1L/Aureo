import {
    APPRAISAL_LIST_REQUEST, APPRAISAL_LIST_SUCCESS, APPRAISAL_LIST_FAIL,
    APPRAISAL_DETAILS_REQUEST, APPRAISAL_DETAILS_SUCCESS, APPRAISAL_DETAILS_FAIL,
    APPRAISAL_CREATE_REQUEST, APPRAISAL_CREATE_SUCCESS, APPRAISAL_CREATE_FAIL, APPRAISAL_CREATE_RESET,
    APPRAISAL_RESPOND_REQUEST, APPRAISAL_RESPOND_SUCCESS, APPRAISAL_RESPOND_FAIL, APPRAISAL_RESPOND_RESET,
    ADMIN_APPRAISALS_REQUEST, ADMIN_APPRAISALS_SUCCESS, ADMIN_APPRAISALS_FAIL,
    ADMIN_APPRAISAL_REVIEW_REQUEST, ADMIN_APPRAISAL_REVIEW_SUCCESS, ADMIN_APPRAISAL_REVIEW_FAIL, ADMIN_APPRAISAL_REVIEW_RESET,
    ADMIN_APPRAISAL_CONVERT_REQUEST, ADMIN_APPRAISAL_CONVERT_SUCCESS, ADMIN_APPRAISAL_CONVERT_FAIL, ADMIN_APPRAISAL_CONVERT_RESET,
    APPRAISAL_CLEAR_ERRORS
} from "../constants/appraisalConstants";

export const appraisalListReducer = (state = { appraisals: [] }, action) => {
    switch (action.type) {
        case APPRAISAL_LIST_REQUEST:
            return { ...state, loading: true };
        case APPRAISAL_LIST_SUCCESS:
            return { loading: false, appraisals: action.payload, error: null };
        case APPRAISAL_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        case APPRAISAL_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const appraisalDetailsReducer = (state = { appraisal: null }, action) => {
    switch (action.type) {
        case APPRAISAL_DETAILS_REQUEST:
            return { ...state, loading: true };
        case APPRAISAL_DETAILS_SUCCESS:
            return { loading: false, appraisal: action.payload, error: null };
        case APPRAISAL_DETAILS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case APPRAISAL_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const appraisalCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case APPRAISAL_CREATE_REQUEST:
            return { loading: true };
        case APPRAISAL_CREATE_SUCCESS:
            return { loading: false, success: true, appraisal: action.payload };
        case APPRAISAL_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case APPRAISAL_CREATE_RESET:
            return {};
        case APPRAISAL_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const appraisalRespondReducer = (state = {}, action) => {
    switch (action.type) {
        case APPRAISAL_RESPOND_REQUEST:
            return { loading: true };
        case APPRAISAL_RESPOND_SUCCESS:
            return { loading: false, success: true, appraisal: action.payload };
        case APPRAISAL_RESPOND_FAIL:
            return { loading: false, error: action.payload };
        case APPRAISAL_RESPOND_RESET:
            return {};
        case APPRAISAL_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const adminAppraisalsReducer = (state = { appraisals: [] }, action) => {
    switch (action.type) {
        case ADMIN_APPRAISALS_REQUEST:
            return { ...state, loading: true };
        case ADMIN_APPRAISALS_SUCCESS:
            return { loading: false, appraisals: action.payload, error: null };
        case ADMIN_APPRAISALS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case APPRAISAL_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const adminAppraisalActionReducer = (state = {}, action) => {
    switch (action.type) {
        case ADMIN_APPRAISAL_REVIEW_REQUEST:
        case ADMIN_APPRAISAL_CONVERT_REQUEST:
            return { loading: true };
        case ADMIN_APPRAISAL_REVIEW_SUCCESS:
            return { loading: false, isReviewed: true, appraisal: action.payload };
        case ADMIN_APPRAISAL_CONVERT_SUCCESS:
            return {
                loading: false,
                isConverted: true,
                appraisal: action.payload.appraisal,
                product: action.payload.product
            };
        case ADMIN_APPRAISAL_REVIEW_FAIL:
        case ADMIN_APPRAISAL_CONVERT_FAIL:
            return { loading: false, error: action.payload };
        case ADMIN_APPRAISAL_REVIEW_RESET:
        case ADMIN_APPRAISAL_CONVERT_RESET:
            return {};
        case APPRAISAL_CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
