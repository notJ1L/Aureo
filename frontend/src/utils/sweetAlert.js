import Swal from "sweetalert2";

// Aureo uses SweetAlert2 for every destructive confirmation and Toastify for
// success and error notifications. The theme overrides keep both libraries in
// the black and gold palette.

const darkTheme = {
    background: "#171a20",
    color: "#f4efe6",
    border: "1px solid #2a2d33",
    customClass: {
        popup: "aureo-swal-popup",
        confirmButton: "aureo-swal-confirm",
        cancelButton: "aureo-swal-cancel"
    }
};

export const confirmAction = async ({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = true
}) => {
    const result = await Swal.fire({
        ...darkTheme,
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        icon: danger ? "warning" : "question",
        customClass: {
            ...darkTheme.customClass,
            confirmButton: danger
                ? "aureo-swal-confirm aureo-swal-danger"
                : "aureo-swal-confirm"
        }
    });

    return result.isConfirmed;
};

export const showError = (message) => {
    Swal.fire({
        ...darkTheme,
        title: "Something went wrong",
        text: message || "Please try again.",
        icon: "error",
        confirmButtonText: "Close"
    });
};

export const showSuccess = (message, title = "All set") => {
    Swal.fire({
        ...darkTheme,
        title,
        text: message,
        icon: "success",
        confirmButtonText: "Close"
    });
};

export default { confirmAction, showError, showSuccess };
