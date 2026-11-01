import { useSelector } from "react-redux";

export function useCartCount() {
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
}

export default useCartCount;
