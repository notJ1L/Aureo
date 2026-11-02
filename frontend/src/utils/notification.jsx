import { toast } from "react-toastify";
import { IconBag, IconHeart, IconCheck, IconInfo, IconAlert } from "../components/layout/icons";

/**
 * The single notification layer for the storefront.
 *
 * Cart and wishlist events (and any future ones) all render through the same
 * component, so they stay identical in structure, style and animation.
 */

// How long every notification stays visible before it begins to fade out.
// This single value drives the storefront notifications here AND the global
// ToastContainer default in main.jsx, so all notifications share one duration.
export const AUTO_CLOSE_MS = 10000;

const ICONS = {
    cart: IconBag,
    wishlist: IconHeart,
    success: IconCheck,
    info: IconInfo,
    error: IconAlert
};

function AureoNotification({ type, message }) {
    const Icon = ICONS[type] || ICONS.info;

    return (
        <div className="aureo-notification__content">
            <span className="aureo-notification__icon">
                <Icon width={18} height={18} />
            </span>
            <span className="aureo-notification__message">{message}</span>
        </div>
    );
}

/**
 * Shows the shared Aureo notification.
 *
 * `type` selects the gold icon (`"cart"`, `"wishlist"`, `"success"`, `"info"`, `"error"`), 
 * `message` is the copy. Notifications now stack up instead of replacing each other.
 */
export function showNotification({ type = "info", message }) {
    const content = <AureoNotification type={type} message={message} />;

    toast(content, {
        position: "bottom-right",
        autoClose: AUTO_CLOSE_MS,
        hideProgressBar: true,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        pauseOnHover: true,
        className: "aureo-notification",
    });
}
