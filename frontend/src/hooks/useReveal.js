import { useEffect } from "react";

// Adds `is-revealed` to every `[data-reveal]` element once it scrolls into
// view. Pass a dependency (for example the number of cards) so elements that
// are added later are observed too.
export function useReveal(dependency) {
    useEffect(() => {
        const elements = document.querySelectorAll("[data-reveal]:not(.is-revealed)");

        if (!("IntersectionObserver" in window)) {
            elements.forEach((element) => element.classList.add("is-revealed"));
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-revealed");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );

        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [dependency]);
}

export default useReveal;
