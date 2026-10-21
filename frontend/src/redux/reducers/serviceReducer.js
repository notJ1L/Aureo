import {
    SERVICE_LIST_REQUEST, SERVICE_LIST_SUCCESS, SERVICE_LIST_FAIL,
    ADMIN_SERVICE_LIST_REQUEST, ADMIN_SERVICE_LIST_SUCCESS, ADMIN_SERVICE_LIST_FAIL,
    SERVICE_CREATE_REQUEST, SERVICE_CREATE_SUCCESS, SERVICE_CREATE_FAIL, SERVICE_CREATE_RESET,
    SERVICE_UPDATE_REQUEST, SERVICE_UPDATE_SUCCESS, SERVICE_UPDATE_FAIL, SERVICE_UPDATE_RESET,
    SERVICE_DELETE_REQUEST, SERVICE_DELETE_SUCCESS, SERVICE_DELETE_FAIL, SERVICE_DELETE_RESET,
    SERVICE_BULK_DELETE_REQUEST, SERVICE_BULK_DELETE_SUCCESS, SERVICE_BULK_DELETE_FAIL, SERVICE_BULK_DELETE_RESET,
    TICKET_LIST_REQUEST, TICKET_LIST_SUCCESS, TICKET_LIST_FAIL,
    TICKET_CREATE_REQUEST, TICKET_CREATE_SUCCESS, TICKET_CREATE_FAIL, TICKET_CREATE_RESET,
    ADMIN_TICKET_LIST_REQUEST, ADMIN_TICKET_LIST_SUCCESS, ADMIN_TICKET_LIST_FAIL,
    ADMIN_TICKET_STATUS_REQUEST, ADMIN_TICKET_STATUS_SUCCESS, ADMIN_TICKET_STATUS_FAIL, ADMIN_TICKET_STATUS_RESET,
    DASHBOARD_REQUEST, DASHBOARD_SUCCESS, DASHBOARD_FAIL,
    CHAT_SEND_REQUEST, CHAT_SEND_SUCCESS, CHAT_SEND_FAIL,
    CHAT_HISTORY_LOADED, CHAT_CLEAR
} from "../constants/serviceConstants";

export const serviceListReducer = (state = { services: [] }, action) => {
    switch (action.type) {
        case SERVICE_LIST_REQUEST:
        case ADMIN_SERVICE_LIST_REQUEST:
            return { ...state, loading: true };
        case SERVICE_LIST_SUCCESS:
        case ADMIN_SERVICE_LIST_SUCCESS:
            return { loading: false, services: action.payload, error: null };
        case SERVICE_LIST_FAIL:
        case ADMIN_SERVICE_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const serviceMutationReducer = (state = {}, action) => {
    switch (action.type) {
        case SERVICE_CREATE_REQUEST:
        case SERVICE_UPDATE_REQUEST:
        case SERVICE_DELETE_REQUEST:
        case SERVICE_BULK_DELETE_REQUEST:
            return { loading: true };
        case SERVICE_CREATE_SUCCESS:
            return { loading: false, success: true, createdService: action.payload };
        case SERVICE_UPDATE_SUCCESS:
            return { loading: false, isUpdated: true, updatedService: action.payload };
        case SERVICE_DELETE_SUCCESS:
            return { loading: false, isDeleted: true, message: action.payload.message };
        case SERVICE_BULK_DELETE_SUCCESS:
            return {
                loading: false,
                isBulkDeleted: true,
                deleted: action.payload.deleted,
                message: action.payload.message
            };
        case SERVICE_CREATE_FAIL:
        case SERVICE_UPDATE_FAIL:
        case SERVICE_DELETE_FAIL:
        case SERVICE_BULK_DELETE_FAIL:
            return { loading: false, error: action.payload };
        case SERVICE_CREATE_RESET:
        case SERVICE_UPDATE_RESET:
        case SERVICE_DELETE_RESET:
        case SERVICE_BULK_DELETE_RESET:
            return {};
        default:
            return state;
    }
};

export const ticketListReducer = (state = { tickets: [] }, action) => {
    switch (action.type) {
        case TICKET_LIST_REQUEST:
        case ADMIN_TICKET_LIST_REQUEST:
            return { ...state, loading: true };
        case TICKET_LIST_SUCCESS:
        case ADMIN_TICKET_LIST_SUCCESS:
            return { loading: false, tickets: action.payload, error: null };
        case TICKET_LIST_FAIL:
        case ADMIN_TICKET_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const ticketCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case TICKET_CREATE_REQUEST:
            return { loading: true };
        case TICKET_CREATE_SUCCESS:
            return { loading: false, success: true, ticket: action.payload };
        case TICKET_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case TICKET_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const adminTicketStatusReducer = (state = {}, action) => {
    switch (action.type) {
        case ADMIN_TICKET_STATUS_REQUEST:
            return { loading: true };
        case ADMIN_TICKET_STATUS_SUCCESS:
            return { loading: false, isUpdated: true, ticket: action.payload };
        case ADMIN_TICKET_STATUS_FAIL:
            return { loading: false, error: action.payload };
        case ADMIN_TICKET_STATUS_RESET:
            return {};
        default:
            return state;
    }
};

export const dashboardReducer = (state = {}, action) => {
    switch (action.type) {
        case DASHBOARD_REQUEST:
            return { ...state, loading: true };
        case DASHBOARD_SUCCESS:
            return { loading: false, ...action.payload, error: null };
        case DASHBOARD_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const chatReducer = (state = { messages: [], preferences: {}, loading: false }, action) => {
    switch (action.type) {
        case CHAT_SEND_REQUEST:
            return { ...state, loading: true, error: null };
        case CHAT_SEND_SUCCESS:
            return {
                ...state,
                loading: false,
                messages: [
                    ...state.messages,
                    { role: "user", content: action.payload.userMessage || "" },
                    { role: "assistant", content: action.payload.reply }
                ].filter((message) => message.content),
                preferences: action.payload.preferences,
                matches: action.payload.matches
            };
        case CHAT_SEND_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CHAT_HISTORY_LOADED:
            return {
                ...state,
                loading: false,
                messages: action.payload.messages,
                preferences: action.payload.preferences
            };
        case CHAT_CLEAR:
            return { messages: [], preferences: {}, loading: false };
        default:
            return state;
    }
};
