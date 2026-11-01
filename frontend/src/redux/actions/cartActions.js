import {
    CART_ADD_ITEM,
    CART_REMOVE_ITEM,
    CART_UPDATE_ITEM_QUANTITY,
    CART_CLEAR_ITEMS,
    CART_SYNC
} from "../constants/cartConstants";

export const addToCart = (productData, quantity = 1) => (dispatch) => {
    dispatch({
        type: CART_ADD_ITEM,
        payload: {
            product: productData._id || productData.product,
            name: productData.name,
            brand: productData.brand,
            price: productData.price,
            image: productData.images?.[0]?.url || productData.image || "",
            condition: productData.condition,
            stock: productData.stock,
            quantity
        }
    });
};

export const removeFromCart = (productId) => (dispatch) => {
    dispatch({
        type: CART_REMOVE_ITEM,
        payload: productId
    });
};

export const updateCartQuantity = (productId, quantity) => (dispatch) => {
    dispatch({
        type: CART_UPDATE_ITEM_QUANTITY,
        payload: { productId, quantity }
    });
};

export const clearCart = () => (dispatch) => {
    dispatch({
        type: CART_CLEAR_ITEMS
    });
};

export const syncCart = () => (dispatch) => {
    dispatch({
        type: CART_SYNC
    });
};

