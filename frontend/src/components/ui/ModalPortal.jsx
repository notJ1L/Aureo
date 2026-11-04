import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * ModalPortal
 * Mounts the modal directly into document.body to break free from any
 * ancestor CSS transforms, filters, or overflow containment.
 * Also locks document.body scroll while the modal is active.
 */
export default function ModalPortal({ children }) {
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    return createPortal(children, document.body);
}

