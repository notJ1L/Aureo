// Unit 2: shared Aureo UI components.
//
// Two component libraries are used side by side, both restyled for the
// black/gold theme:
//
//   * React Bootstrap  -> `AureoTable`, `AureoModal`, `AureoPagination`,
//                         `AureoButton`, `AureoBadge`, `AureoAlert`,
//                         `AureoSpinner`, `AureoFormGroup`, `AureoProgressBar`
//   * Material UI      -> `AureoCard`, `AureoChip`, `AureoTextField`,
//                         `AureoDialog`, `AureoRating`, `AureoStack`
//
// The Bootstrap CSS is not imported wholesale, because the Bootstrap reboot
// would reset the Aureo heading and body styles. Only the rules the
// components actually need live in `src/components/ui/ui.css`.

// Deep imports are used instead of the `@mui/material` barrel. The barrel
// re-exports every component, which defeats tree shaking and adds several
// hundred kilobytes to the bundle.
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import MuiButton from "@mui/material/Button";

import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Pagination from "react-bootstrap/Pagination";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";

import "./ui.css";

/* -------------------------------------------------------------------------- */
/* Material UI                                                                */
/* -------------------------------------------------------------------------- */

export function AureoCard({ children, sx, className = "", ...rest }) {
    return (
        <Card className={`aureo-card ${className}`.trim()} sx={sx} {...rest}>
            <CardContent className="aureo-card-content">{children}</CardContent>
        </Card>
    );
}

export function AureoChip({ label, color = "default", size = "small", sx, ...rest }) {
    const palette = {
        default: { backgroundColor: "rgba(201, 164, 92, 0.14)", color: "var(--gold)" },
        success: { backgroundColor: "rgba(63, 185, 127, 0.14)", color: "var(--success)" },
        danger: { backgroundColor: "rgba(229, 72, 77, 0.14)", color: "var(--danger)" },
        muted: { backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }
    };

    return (
        <Chip
            label={label}
            size={size}
            sx={{ fontWeight: 600, ...palette[color], ...sx }}
            {...rest}
        />
    );
}

export function AureoTextField({ label, error, helperText, sx, ...rest }) {
    return (
        <TextField
            label={label}
            size="small"
            fullWidth
            error={Boolean(error)}
            helperText={error || helperText}
            sx={{ marginBottom: "1rem", ...sx }}
            {...rest}
        />
    );
}

/* Fix 2: the single Select used everywhere a native <select> used to be.
 * It is a Material UI Select so the gold theme in `aureoTheme.js` applies,
 * and it accepts the same `value` / `onChange` shape the native element did
 * (`onChange` receives the DOM event, so `event.target.value` still works). */
export function AureoSelect({
    value,
    onChange,
    options = [],
    id,
    className = "",
    ariaInvalid = false,
    error = false,
    fullWidth = true,
    ...rest
}) {
    return (
        <FormControl
            fullWidth={fullWidth}
            size="small"
            error={error || ariaInvalid}
            className={`aureo-select ${className}`.trim()}
            variant="outlined"
        >
            <Select
                id={id}
                value={value ?? ""}
                onChange={onChange}
                inputProps={{ "aria-invalid": ariaInvalid ? "true" : undefined }}
                MenuProps={{
                    disableScrollLock: true,
                    ...rest.MenuProps
                }}
                {...rest}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value} className="aureo-select-item">
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

/* Fix 3: the single checkbox used everywhere. The custom box/check glyphs
 * replace the Material icons so the control is a gold rounded square with a
 * dark checkmark, with no trace of the browser default. */
export function AureoCheckbox({ className = "", ...rest }) {
    return (
        <Checkbox
            className={`aureo-checkbox ${className}`.trim()}
            icon={<span className="aureo-checkbox-box" aria-hidden="true" />}
            checkedIcon={
                <span className="aureo-checkbox-box aureo-checkbox-box--checked" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                </span>
            }
            {...rest}
        />
    );
}

export function AureoDialog({ open, onClose, title, children, actions }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="aureo-dialog-title"
        >
            <DialogTitle id="aureo-dialog-title" className="aureo-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent className="aureo-dialog-content">{children}</DialogContent>
            {actions ? <DialogActions className="aureo-dialog-actions">{actions}</DialogActions> : null}
        </Dialog>
    );
}

export function AureoRating({ value, onChange, readOnly = false, size = "small", ...rest }) {
    return (
        <Rating
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            size={size}
            precision={1}
            {...rest}
        />
    );
}

export function AureoStack({ direction = "row", spacing = 1, children, ...rest }) {
    return (
        <Stack direction={direction} spacing={spacing} {...rest}>
            {children}
        </Stack>
    );
}

export function AureoMuiButton({ children, variant = "contained", ...rest }) {
    return (
        <MuiButton variant={variant} size="small" {...rest}>
            {children}
        </MuiButton>
    );
}

/* -------------------------------------------------------------------------- */
/* React Bootstrap                                                            */
/* -------------------------------------------------------------------------- */

export function AureoTable({ children, striped = false, hover = true, className = "", ...rest }) {
    return (
        <Table
            striped={striped}
            hover={hover}
            className={`aureo-table ${className}`.trim()}
            {...rest}
        >
            {children}
        </Table>
    );
}

export function AureoModal({ show, onHide, title, children, footer, size }) {
    return (
        <Modal show={show} onHide={onHide} size={size} centered className="aureo-modal">
            <Modal.Header closeButton className="aureo-modal-header">
                <Modal.Title className="aureo-modal-title">{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="aureo-modal-body">{children}</Modal.Body>
            {footer ? <Modal.Footer className="aureo-modal-footer">{footer}</Modal.Footer> : null}
        </Modal>
    );
}

export function AureoPagination({ currentPage, totalPages, onSelect, className = "" }) {
    if (!totalPages || totalPages < 1) {
        return null;
    }

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onClick={(e) => {
                const target = e.target.closest("a");
                const next = Number(target?.getAttribute("href")?.replace("#", ""));

                if (next && next !== currentPage) {
                    onSelect(next);
                }
            }}
            className={`aureo-pagination ${className}`.trim()}
        />
    );
}

export function AureoButton({ children, variant = "primary", ...rest }) {
    return (
        <Button variant={variant} className={`aureo-btn aureo-btn-${variant}`} {...rest}>
            {children}
        </Button>
    );
}

export function AureoBadge({ children, bg = "var(--gold)", ...rest }) {
    return (
        <Badge bg={bg} text={children} className="aureo-badge" {...rest} />
    );
}

// Fix 6: the single status pill used by the order and inventory views. A page
// passes the raw status and the component picks the tone, so the colours stay
// identical everywhere.
const STATUS_TONES = {
    pending: "pending",
    paid: "paid",
    shipped: "shipped",
    completed: "completed",
    cancelled: "cancelled",
    active: "active",
    inactive: "inactive",
    archived: "inactive",
    new: "new",
    "second-hand": "second"
};

export function StatusBadge({ status, label, className = "" }) {
    const tone = STATUS_TONES[String(status ?? "").toLowerCase()] || "pending";

    return (
        <span className={`aureo-status aureo-status--${tone} ${className}`.trim()}>
            {label ?? status}
        </span>
    );
}

export function AureoAlert({ variant = "info", children, ...rest }) {
    return (
        <Alert variant={variant} className={`aureo-alert aureo-alert-${variant}`} {...rest}>
            {children}
        </Alert>
    );
}

export function AureoSpinner({ size = "sm", ...rest }) {
    return <Spinner animation="border" size={size} className="aureo-spinner" {...rest} />;
}

export function AureoFormGroup({ label, children, controlId, feedback, feedbackType = "invalid" }) {
    return (
        <Form.Group className="aureo-form-group" controlId={controlId}>
            {label ? <Form.Label className="aureo-form-label">{label}</Form.Label> : null}
            {children}
            {feedback ? (
                <Form.Control.Feedback type={feedbackType} className="aureo-form-feedback">
                    {feedback}
                </Form.Control.Feedback>
            ) : null}
        </Form.Group>
    );
}

export function AureoProgressBar({ now = 0, label, ...rest }) {
    return (
        <ProgressBar now={now} label={label} className="aureo-progress" {...rest} />
    );
}

export { AureoSkeleton, WatchCardSkeleton, ProductDetailSkeleton } from "./Skeleton";

export default {
    AureoCard,
    AureoChip,
    AureoTextField,
    AureoSelect,
    AureoCheckbox,
    AureoDialog,
    AureoRating,
    AureoStack,
    AureoMuiButton,
    AureoTable,
    AureoModal,
    AureoPagination,
    AureoButton,
    AureoBadge,
    StatusBadge,
    AureoAlert,
    AureoSpinner,
    AureoFormGroup,
    AureoProgressBar
};
