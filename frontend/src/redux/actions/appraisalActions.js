import api from "../../services/api";
import {
    APPRAISAL_LIST_REQUEST, APPRAISAL_LIST_SUCCESS, APPRAISAL_LIST_FAIL,
    APPRAISAL_DETAILS_REQUEST, APPRAISAL_DETAILS_SUCCESS, APPRAISAL_DETAILS_FAIL,
    APPRAISAL_CREATE_REQUEST, APPRAISAL_CREATE_SUCCESS, APPRAISAL_CREATE_FAIL,
    APPRAISAL_RESPOND_REQUEST, APPRAISAL_RESPOND_SUCCESS, APPRAISAL_RESPOND_FAIL,
    ADMIN_APPRAISALS_REQUEST, ADMIN_APPRAISALS_SUCCESS, ADMIN_APPRAISALS_FAIL,
    ADMIN_APPRAISAL_REVIEW_REQUEST, ADMIN_APPRAISAL_REVIEW_SUCCESS, ADMIN_APPRAISAL_REVIEW_FAIL,
    ADMIN_APPRAISAL_CONVERT_REQUEST, ADMIN_APPRAISAL_CONVERT_SUCCESS, ADMIN_APPRAISAL_CONVERT_FAIL,
    APPRAISAL_CLEAR_ERRORS
} from "../constants/appraisalConstants";

// FR 3.1: the appraisals of the signed in collector.
export const getMyAppraisals = () => async (dispatch) => {
    dispatch({ type: APPRAISAL_LIST_REQUEST });
    try {
        const { data } = await api.get("/appraisals/me");
        dispatch({ type: APPRAISAL_LIST_SUCCESS, payload: data.appraisals });
    } catch (err) {
        dispatch({
            type: APPRAISAL_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load your appraisals"
        });
    }
};

export const getAppraisalDetails = (id) => async (dispatch) => {
    dispatch({ type: APPRAISAL_DETAILS_REQUEST });
    try {
        const { data } = await api.get(`/appraisal/${id}`);
        dispatch({ type: APPRAISAL_DETAILS_SUCCESS, payload: data.appraisal });
    } catch (err) {
        dispatch({
            type: APPRAISAL_DETAILS_FAIL,
            payload: err.response?.data?.message || "Failed to load the appraisal"
        });
    }
};

// FR 3.1 / FR 3.2: submit an appraisal with its photos.
export const createAppraisal = (formData) => async (dispatch) => {
    dispatch({ type: APPRAISAL_CREATE_REQUEST });
    try {
        const { data } = await api.post("/appraisal/new", formData);
        dispatch({ type: APPRAISAL_CREATE_SUCCESS, payload: data.appraisal });
    } catch (err) {
        dispatch({
            type: APPRAISAL_CREATE_FAIL,
            payload: err.response?.data?.message || "Failed to submit the appraisal"
        });
    }
};

// FR 3.3: the collector accepts or rejects the offer.
export const respondToOffer = (id, decision) => async (dispatch) => {
    dispatch({ type: APPRAISAL_RESPOND_REQUEST });
    try {
        const { data } = await api.put(`/appraisal/${id}/respond`, { decision });
        dispatch({ type: APPRAISAL_RESPOND_SUCCESS, payload: data.appraisal });
    } catch (err) {
        dispatch({
            type: APPRAISAL_RESPOND_FAIL,
            payload: err.response?.data?.message || "Failed to respond to the offer"
        });
    }
};

// FR 3.3: every appraisal for the admin.
export const getAdminAppraisals = () => async (dispatch) => {
    dispatch({ type: ADMIN_APPRAISALS_REQUEST });
    try {
        const { data } = await api.get("/admin/appraisals");
        dispatch({ type: ADMIN_APPRAISALS_SUCCESS, payload: data.appraisals });
    } catch (err) {
        dispatch({
            type: ADMIN_APPRAISALS_FAIL,
            payload: err.response?.data?.message || "Failed to load the appraisals"
        });
    }
};

// FR 3.3: the admin makes an offer or rejects the appraisal.
export const reviewAppraisal = (id, payload) => async (dispatch) => {
    dispatch({ type: ADMIN_APPRAISAL_REVIEW_REQUEST });
    try {
        const { data } = await api.put(`/admin/appraisal/${id}`, payload);
        dispatch({ type: ADMIN_APPRAISAL_REVIEW_SUCCESS, payload: data.appraisal });
    } catch (err) {
        dispatch({
            type: ADMIN_APPRAISAL_REVIEW_FAIL,
            payload: err.response?.data?.message || "Failed to review the appraisal"
        });
    }
};

// FR 3.3: turn an accepted appraisal into a second-hand listing.
export const convertAppraisal = (id) => async (dispatch) => {
    dispatch({ type: ADMIN_APPRAISAL_CONVERT_REQUEST });
    try {
        const { data } = await api.post(`/admin/appraisal/${id}/convert`);
        dispatch({
            type: ADMIN_APPRAISAL_CONVERT_SUCCESS,
            payload: { appraisal: data.appraisal, product: data.product }
        });
    } catch (err) {
        dispatch({
            type: ADMIN_APPRAISAL_CONVERT_FAIL,
            payload: err.response?.data?.message || "Failed to convert the appraisal"
        });
    }
};

export const clearAppraisalErrors = () => ({ type: APPRAISAL_CLEAR_ERRORS });
