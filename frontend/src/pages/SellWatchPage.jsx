import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import {
    createAppraisal,
    clearAppraisalErrors
} from "../redux/actions/appraisalActions";
import { APPRAISAL_CREATE_RESET } from "../redux/constants/appraisalConstants";
import { appraisalSchema } from "../utils/validationSchemas";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function SellWatchPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { loading, success, error } = useSelector((state) => state.appraisalCreate);

    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(appraisalSchema),
        mode: "onBlur",
        defaultValues: {
            brand: "",
            model: "",
            movement: "automatic",
            caseSize: 40,
            condition: "second-hand",
            year: new Date().getFullYear(),
            askingPrice: ""
        }
    });

    useEffect(() => {
        if (success) {
            toast.success("Appraisal submitted. We will contact you with an offer.");
            dispatch({ type: APPRAISAL_CREATE_RESET });
            navigate("/appraisals");
        }
    }, [success, dispatch, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearAppraisalErrors());
        };
    }, [dispatch]);

    const acceptFiles = (fileList) => {
        const selected = Array.from(fileList || []);
        if (selected.length === 0) {
            return;
        }

        if (selected.length > MAX_PHOTOS) {
            toast.error(`You can upload a maximum of ${MAX_PHOTOS} photos.`);
            return;
        }

        for (const file of selected) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File "${file.name}" exceeds the 5MB limit.`);
                return;
            }
        }

        setFiles(selected);
        setPreviews(selected.map((file) => URL.createObjectURL(file)));
    };

    const handleFiles = (event) => {
        acceptFiles(event.target.files);
        // Reset so the same file can be picked again after a validation error.
        event.target.value = "";
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        acceptFiles(event.dataTransfer.files);
    };

    const onSubmit = (values) => {
        if (files.length === 0) {
            toast.error("Please add at least one photo of the watch.");
            return;
        }

        const payload = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            payload.append(key, value);
        });

        payload.append("hasBox", document.getElementById("hasBox")?.checked || "false");
        payload.append("hasPapers", document.getElementById("hasPapers")?.checked || "false");

        files.forEach((file) => payload.append("photos", file));

        dispatch(createAppraisal(payload));
    };

    if (!isAuthenticated) {
        return (
            <main className="sell-page page-enter">
                <SiteHeader variant="solid" />
                <div className="sell-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <section className="auth-card" style={{ maxWidth: "480px", margin: "3rem auto", textAlign: "center" }}>
                        <p className="eyebrow">SELL YOUR WATCH</p>
                        <h1>Sign in to request an appraisal</h1>
                        <p className="auth-description">
                            Appraisals and consignment evaluations are reserved for registered collectors.
                        </p>
                        <Link className="gold-button" to="/login" style={{ display: "inline-block", marginTop: "1rem" }}>
                            Sign in to Continue
                        </Link>
                    </section>
                </div>
                <SiteFooter />
            </main>
        );
    }

    if (!user?.isVerified) {
        return (
            <main className="sell-page page-enter">
                <SiteHeader variant="solid" />
                <div className="sell-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <section className="auth-card" style={{ maxWidth: "480px", margin: "3rem auto", textAlign: "center" }}>
                        <p className="eyebrow" style={{ color: "var(--danger)" }}>VERIFICATION REQUIRED</p>
                        <h1>Verify your email first</h1>
                        <p className="auth-description">
                            Only verified collectors can submit a timepiece for consignment appraisal.
                        </p>
                        <Link className="gold-button" to="/register" style={{ display: "inline-block", marginTop: "1rem" }}>
                            Enter Verification Code
                        </Link>
                    </section>
                </div>
                <SiteFooter />
            </main>
        );
    }

    return (
        <main className="sell-page page-enter">
            <SiteHeader variant="solid" />

            <div className="sell-container">
                <div className="sell-heading">
                    <p className="eyebrow">SELL YOUR WATCH</p>
                    <h1>Request an appraisal</h1>
                    <p className="auth-description">
                        Tell us about the piece you want to sell. Our team reviews every
                        request and comes back with an offer within two working days.
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
                    <div className="form-row-2">
                        <label>
                            Brand
                            <input
                                {...register("brand")}
                                placeholder="e.g. Rolex"
                                aria-invalid={Boolean(errors.brand)}
                            />
                            {errors.brand && <span className="field-error">{errors.brand.message}</span>}
                        </label>
                        <label>
                            Model
                            <input
                                {...register("model")}
                                placeholder="e.g. Datejust 36"
                                aria-invalid={Boolean(errors.model)}
                            />
                            {errors.model && <span className="field-error">{errors.model.message}</span>}
                        </label>
                    </div>

                    <div className="form-row-3">
                        <label>
                            Movement
                            <select {...register("movement")} className="catalog-select">
                                <option value="automatic">Automatic</option>
                                <option value="manual">Manual</option>
                                <option value="quartz">Quartz</option>
                            </select>
                            {errors.movement && <span className="field-error">{errors.movement.message}</span>}
                        </label>
                        <label>
                            Case Size (mm)
                            <input type="number" step="1" {...register("caseSize")} />
                            {errors.caseSize && <span className="field-error">{errors.caseSize.message}</span>}
                        </label>
                        <label>
                            Year
                            <input type="number" step="1" {...register("year")} />
                            {errors.year && <span className="field-error">{errors.year.message}</span>}
                        </label>
                    </div>

                    <div className="form-row-2">
                        <label>
                            Condition
                            <select {...register("condition")} className="catalog-select">
                                <option value="second-hand">Second-hand</option>
                                <option value="new">New</option>
                            </select>
                            {errors.condition && <span className="field-error">{errors.condition.message}</span>}
                        </label>
                        <label>
                            Asking Price (PHP)
                            <input type="number" step="1" {...register("askingPrice")} />
                            {errors.askingPrice && <span className="field-error">{errors.askingPrice.message}</span>}
                        </label>
                    </div>

                    <div className="form-row-2">
                        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input type="checkbox" id="hasBox" />
                            Original box included
                        </label>
                        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input type="checkbox" id="hasPapers" />
                            Original papers included
                        </label>
                    </div>

                    <div className="upload-field">
                        <span className="upload-label">Photographs (front, back, movement, box) &mdash; max {MAX_PHOTOS}</span>
                        <label
                            htmlFor="photo-upload"
                            className={`upload-zone${isDragging ? " is-dragging" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <svg
                                className="upload-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="upload-title">Drag photos here or click to browse</span>
                            <span className="upload-subtext">
                                JPG or PNG &middot; max 5 MB per photo &middot; at least 1 required &middot; max {MAX_PHOTOS}
                            </span>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/jpeg,image/png"
                                multiple
                                onChange={handleFiles}
                                style={{ display: "none" }}
                            />
                        </label>

                        {previews.length > 0 && (
                            <div className="upload-preview-grid">
                                {previews.map((src, index) => (
                                    <img key={src} src={src} alt={`Preview ${index + 1}`} className="upload-thumb" />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-actions" style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                        <button type="button" className="outline-button" onClick={() => navigate("/appraisals")}>
                            Cancel
                        </button>
                        <button type="submit" className="gold-button" disabled={loading}>
                            {loading ? "Submitting..." : "Submit appraisal"}
                        </button>
                    </div>
                </form>
            </div>

            <SiteFooter />
        </main>
    );
}

export default SellWatchPage;
