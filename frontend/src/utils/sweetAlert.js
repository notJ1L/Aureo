import Swal from "sweetalert2";

// Aureo uses SweetAlert2 for every destructive confirmation and Toastify for
// success and error notifications. The theme overrides keep both libraries in
// the black and gold palette.
//
// The colours are read from the CSS tokens at call time, so there is only
// one definition of the palette. The values in `styles/overlays.css` and
// `App.css` do the same thing for the parts of the dialog that are styled
// with a class.

// Reads a token from the document root. The fallback is only used when the
// stylesheet has not loaded yet.
const readToken = (name, fallback) => {
    if (typeof window === "undefined" || !window.getComputedStyle) {
        return fallback;
    }

    const value = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();

    return value || fallback;
};

const buildTheme = () => ({
    background: readToken("--bg-card", "#171a20"),
    color: readToken("--text-primary", "#f4efe6"),
    border: `1px solid ${readToken("--border", "#2a2d33")}`,
    customClass: {
        popup: "aureo-swal-popup",
        confirmButton: "aureo-swal-confirm",
        cancelButton: "aureo-swal-cancel"
    }
});

export const confirmAction = async ({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = true
}) => {
    const theme = buildTheme();

    const result = await Swal.fire({
        ...theme,
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        icon: danger ? "warning" : "question",
        customClass: {
            ...theme.customClass,
            confirmButton: danger
                ? "aureo-swal-confirm aureo-swal-danger"
                : "aureo-swal-confirm"
        }
    });

    return result.isConfirmed;
};

export const showError = (message) => {
    Swal.fire({
        ...buildTheme(),
        title: "Something went wrong",
        text: message || "Please try again.",
        icon: "error",
        confirmButtonText: "Close"
    });
};

export const showSuccess = (message, title = "All set") => {
    Swal.fire({
        ...buildTheme(),
        title,
        text: message,
        icon: "success",
        confirmButtonText: "Close"
    });
};

export default { confirmAction, showError, showSuccess };
