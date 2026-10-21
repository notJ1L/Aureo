import api from "../../services/api";
import {
    SERVICE_LIST_REQUEST, SERVICE_LIST_SUCCESS, SERVICE_LIST_FAIL,
    ADMIN_SERVICE_LIST_REQUEST, ADMIN_SERVICE_LIST_SUCCESS, ADMIN_SERVICE_LIST_FAIL,
    SERVICE_CREATE_REQUEST, SERVICE_CREATE_SUCCESS, SERVICE_CREATE_FAIL,
    SERVICE_UPDATE_REQUEST, SERVICE_UPDATE_SUCCESS, SERVICE_UPDATE_FAIL,
    SERVICE_DELETE_REQUEST, SERVICE_DELETE_SUCCESS, SERVICE_DELETE_FAIL,
    SERVICE_BULK_DELETE_REQUEST, SERVICE_BULK_DELETE_SUCCESS, SERVICE_BULK_DELETE_FAIL,
    TICKET_LIST_REQUEST, TICKET_LIST_SUCCESS, TICKET_LIST_FAIL,
    TICKET_CREATE_REQUEST, TICKET_CREATE_SUCCESS, TICKET_CREATE_FAIL,
    ADMIN_TICKET_LIST_REQUEST, ADMIN_TICKET_LIST_SUCCESS, ADMIN_TICKET_LIST_FAIL,
    ADMIN_TICKET_STATUS_REQUEST, ADMIN_TICKET_STATUS_SUCCESS, ADMIN_TICKET_STATUS_FAIL,
    DASHBOARD_REQUEST, DASHBOARD_SUCCESS, DASHBOARD_FAIL,
    CHAT_SEND_REQUEST, CHAT_SEND_SUCCESS, CHAT_SEND_FAIL,
    CHAT_HISTORY_LOADED, CHAT_CLEAR
} from "../constants/serviceConstants";

// FR 5.1: the public service list.
export const getServices = () => async (dispatch) => {
    dispatch({ type: SERVICE_LIST_REQUEST });
    try {
        const { data } = await api.get("/services");
        dispatch({ type: SERVICE_LIST_SUCCESS, payload: data.services });
    } catch (err) {
        dispatch({
            type: SERVICE_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load the services"
        });
    }
};

export const getAdminServices = () => async (dispatch) => {
    dispatch({ type: ADMIN_SERVICE_LIST_REQUEST });
    try {
        const { data } = await api.get("/services");
        dispatch({ type: ADMIN_SERVICE_LIST_SUCCESS, payload: data.services });
    } catch (err) {
        dispatch({
            type: ADMIN_SERVICE_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load the services"
        });
    }
};

export const createService = (serviceData) => async (dispatch) => {
    dispatch({ type: SERVICE_CREATE_REQUEST });
    try {
        const { data } = await api.post("/admin/service/new", serviceData);
        dispatch({ type: SERVICE_CREATE_SUCCESS, payload: data.service });
    } catch (err) {
        dispatch({
            type: SERVICE_CREATE_FAIL,
            payload: err.response?.data?.message || "Failed to create the service"
        });
    }
};

export const updateService = (id, serviceData) => async (dispatch) => {
    dispatch({ type: SERVICE_UPDATE_REQUEST });
    try {
        const { data } = await api.put(`/admin/service/${id}`, serviceData);
        dispatch({ type: SERVICE_UPDATE_SUCCESS, payload: data.service });
    } catch (err) {
        dispatch({
            type: SERVICE_UPDATE_FAIL,
            payload: err.response?.data?.message || "Failed to update the service"
        });
    }
};

export const deleteService = (id) => async (dispatch) => {
    dispatch({ type: SERVICE_DELETE_REQUEST });
    try {
        const { data } = await api.delete(`/admin/service/${id}`);
        dispatch({ type: SERVICE_DELETE_SUCCESS, payload: { id, message: data.message } });
    } catch (err) {
        dispatch({
            type: SERVICE_DELETE_FAIL,
            payload: err.response?.data?.message || "Failed to remove the service"
        });
    }
};

// MP1: the service datatable offers a checkbox bulk delete.
export const bulkDeleteServices = (ids) => async (dispatch) => {
    dispatch({ type: SERVICE_BULK_DELETE_REQUEST });
    try {
        const { data } = await api.post("/admin/services/bulk-delete", { ids });
        dispatch({
            type: SERVICE_BULK_DELETE_SUCCESS,
            payload: { deleted: data.deleted, message: data.message }
        });
    } catch (err) {
        dispatch({
            type: SERVICE_BULK_DELETE_FAIL,
            payload: err.response?.data?.message || "Failed to delete the selected services"
        });
    }
};

// FR 5.2: the tickets of the signed in collector.
export const getMyTickets = () => async (dispatch) => {
    dispatch({ type: TICKET_LIST_REQUEST });
    try {
        const { data } = await api.get("/tickets/me");
        dispatch({ type: TICKET_LIST_SUCCESS, payload: data.tickets });
    } catch (err) {
        dispatch({
            type: TICKET_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load your tickets"
        });
    }
};

export const createTicket = (ticketData) => async (dispatch) => {
    dispatch({ type: TICKET_CREATE_REQUEST });
    try {
        const { data } = await api.post("/ticket/new", ticketData);
        dispatch({ type: TICKET_CREATE_SUCCESS, payload: data.ticket });
    } catch (err) {
        dispatch({
            type: TICKET_CREATE_FAIL,
            payload: err.response?.data?.message || "Failed to open the ticket"
        });
    }
};

export const getAdminTickets = () => async (dispatch) => {
    dispatch({ type: ADMIN_TICKET_LIST_REQUEST });
    try {
        const { data } = await api.get("/admin/tickets");
        dispatch({ type: ADMIN_TICKET_LIST_SUCCESS, payload: data.tickets });
    } catch (err) {
        dispatch({
            type: ADMIN_TICKET_LIST_FAIL,
            payload: err.response?.data?.message || "Failed to load the tickets"
        });
    }
};

// FR 5.3: the admin moves a ticket through its statuses.
export const updateTicketStatus = (id, status) => async (dispatch) => {
    dispatch({ type: ADMIN_TICKET_STATUS_REQUEST });
    try {
        const { data } = await api.put(`/admin/ticket/${id}`, { status });
        dispatch({ type: ADMIN_TICKET_STATUS_SUCCESS, payload: data.ticket });
    } catch (err) {
        dispatch({
            type: ADMIN_TICKET_STATUS_FAIL,
            payload: err.response?.data?.message || "Failed to update the ticket"
        });
    }
};

// FR 4.4: the dashboard metrics.
export const getDashboard = (params = {}) => async (dispatch) => {
    dispatch({ type: DASHBOARD_REQUEST });
    try {
        const { data } = await api.get("/admin/dashboard", { params });
        dispatch({ type: DASHBOARD_SUCCESS, payload: data });
    } catch (err) {
        dispatch({
            type: DASHBOARD_FAIL,
            payload: err.response?.data?.message || "Failed to load the dashboard"
        });
    }
};

// FR 7.1 / FR 7.2: the rule based assistant.
export const sendChatMessage = (message) => async (dispatch) => {
    dispatch({ type: CHAT_SEND_REQUEST });
    try {
        const { data } = await api.post("/chat", { message });
        dispatch({
            type: CHAT_SEND_SUCCESS,
            payload: {
                userMessage: message,
                reply: data.reply,
                matches: data.matches,
                preferences: data.preferences
            }
        });
    } catch (err) {
        dispatch({
            type: CHAT_SEND_FAIL,
            payload: err.response?.data?.message || "The assistant is unavailable right now"
        });
    }
};

export const loadChatHistory = () => async (dispatch) => {
    try {
        const { data } = await api.get("/chat/history");
        dispatch({
            type: CHAT_HISTORY_LOADED,
            payload: {
                messages: data.messages,
                preferences: data.preferences
            }
        });
    } catch {
        dispatch({ type: CHAT_CLEAR });
    }
};

export const clearChat = () => ({ type: CHAT_CLEAR });
