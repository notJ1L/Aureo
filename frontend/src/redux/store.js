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
    adminOrdersReducer
} from "./reducers/orderReducer";

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
    adminOrders: adminOrdersReducer
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
