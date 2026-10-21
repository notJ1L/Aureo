import { createStore, combineReducers, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";
import { authReducer } from "./reducers/authReducer";
import {
    productListReducer,
    productDetailsReducer,
    wishlistReducer,
    adminProductsReducer,
    productMutationReducer
} from "./reducers/productReducer";
import {
    orderCreateReducer,
    myOrdersReducer,
    orderDetailsReducer,
    orderCancelReducer,
    adminOrdersReducer,
    adminOrderMutationReducer
} from "./reducers/orderReducer";
import {
    appraisalListReducer,
    appraisalDetailsReducer,
    appraisalCreateReducer,
    appraisalRespondReducer,
    adminAppraisalsReducer,
    adminAppraisalActionReducer
} from "./reducers/appraisalReducer";
import {
    serviceListReducer,
    serviceMutationReducer,
    ticketListReducer,
    ticketCreateReducer,
    adminTicketStatusReducer,
    dashboardReducer,
    chatReducer
} from "./reducers/serviceReducer";

const rootReducer = combineReducers({
    auth: authReducer,
    productList: productListReducer,
    productDetails: productDetailsReducer,
    wishlist: wishlistReducer,
    adminProducts: adminProductsReducer,
    productMutation: productMutationReducer,
    orderCreate: orderCreateReducer,
    myOrders: myOrdersReducer,
    orderDetails: orderDetailsReducer,
    orderCancel: orderCancelReducer,
    adminOrders: adminOrdersReducer,
    adminOrderMutation: adminOrderMutationReducer,
    appraisalList: appraisalListReducer,
    appraisalDetails: appraisalDetailsReducer,
    appraisalCreate: appraisalCreateReducer,
    appraisalRespond: appraisalRespondReducer,
    adminAppraisals: adminAppraisalsReducer,
    adminAppraisalAction: adminAppraisalActionReducer,
    serviceList: serviceListReducer,
    serviceMutation: serviceMutationReducer,
    ticketList: ticketListReducer,
    ticketCreate: ticketCreateReducer,
    adminTicketStatus: adminTicketStatusReducer,
    dashboard: dashboardReducer,
    chat: chatReducer
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
