import {
    CART_ADD_ITEM,
    CART_REMOVE_ITEM,
    CART_UPDATE_ITEM_QUANTITY,
    CART_CLEAR_ITEMS,
    CART_SYNC
} from "../constants/cartConstants";

const loadInitialCart = () => {
    try {
        const raw = localStorage.getItem("aureoCart");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveCart = (items) => {
    try {
        localStorage.setItem("aureoCart", JSON.stringify(items));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("aureo:cart-updated"));
            window.dispatchEvent(new Event("storage"));
        }
    } catch (e) {
        console.error("Failed to save cart to localStorage", e);
    }
};

const initialState = {
    cartItems: loadInitialCart()
};

export const cartReducer = (state = initialState, action) => {
    switch (action.type) {
        case CART_ADD_ITEM: {
            const item = action.payload;
            const existItem = state.cartItems.find((x) => x.product === item.product);

            let newItems;
            if (existItem) {
                newItems = state.cartItems.map((x) =>
                    x.product === existItem.product
                        ? { ...x, quantity: item.quantity !== undefined ? item.quantity : x.quantity + 1 }
                        : x
                );
            } else {
                newItems = [...state.cartItems, { ...item, quantity: item.quantity || 1 }];
            }
            saveCart(newItems);
            return { ...state, cartItems: newItems };
        }

        case CART_REMOVE_ITEM: {
            const newItems = state.cartItems.filter((x) => x.product !== action.payload);
            saveCart(newItems);
            return { ...state, cartItems: newItems };
        }

        case CART_UPDATE_ITEM_QUANTITY: {
            const { productId, quantity } = action.payload;
            const newItems = state.cartItems.map((x) =>
                x.product === productId ? { ...x, quantity } : x
            );
            saveCart(newItems);
            return { ...state, cartItems: newItems };
        }

        case CART_CLEAR_ITEMS: {
            saveCart([]);
            return { ...state, cartItems: [] };
        }

        case CART_SYNC: {
            return { ...state, cartItems: loadInitialCart() };
        }

        default:
            return state;
    }
};

