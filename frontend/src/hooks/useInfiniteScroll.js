// Quiz 3: infinite scroll for the homepage product list.
//
// The hook watches a sentinel element with an IntersectionObserver. When the
// sentinel enters the viewport the callback fires once, and the observer
// disconnects until the caller re-enables it. That keeps the scroll from
// firing several requests while a page is still loading.

import { useEffect, useRef } from "react";

export function useInfiniteScroll({ onLoadMore, hasMore = true, loading = false, rootMargin = "240px" }) {
    const sentinelRef = useRef(null);
    const callbackRef = useRef(onLoadMore);

    // Keep the latest callback without re-creating the observer.
    useEffect(() => {
        callbackRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || !hasMore || loading) {
            return undefined;
        }

        if (typeof IntersectionObserver === "undefined") {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    callbackRef.current?.();
                }
            },
            { rootMargin }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loading, rootMargin]);

    return sentinelRef;
}

export default useInfiniteScroll;
