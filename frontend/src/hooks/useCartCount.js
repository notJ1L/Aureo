import { useEffect, useState } from "react";

// The cart lives in localStorage under `aureoCart`. The pages that change it
// dispatch either a "storage" event or the custom "aureo:cart-updated" event.
function readCartCount() {
    try {
        const raw = localStorage.getItem("aureoCart");
        const items = raw ? JSON.parse(raw) : [];
        return items.reduce((total, item) => total + (item.quantity || 1), 0);
    } catch {
        return 0;
    }
}

export function useCartCount() {
    const [count, setCount] = useState(readCartCount);

    useEffect(() => {
        const handleUpdate = () => setCount(readCartCount());

        window.addEventListener("storage", handleUpdate);
        window.addEventListener("aureo:cart-updated", handleUpdate);

        return () => {
            window.removeEventListener("storage", handleUpdate);
            window.removeEventListener("aureo:cart-updated", handleUpdate);
        };
    }, []);

    return count;
}

export default useCartCount;
