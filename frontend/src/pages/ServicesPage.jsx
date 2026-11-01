import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { getServices, getMyTickets, createTicket } from "../redux/actions/serviceActions";
import { TICKET_CREATE_RESET } from "../redux/constants/serviceConstants";
import { ticketSchema } from "../utils/validationSchemas";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { WatchCardSkeleton } from "../components/ui/Skeleton";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

function ServicesPage() {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { services, loading, error } = useSelector((state) => state.serviceList);
    const { tickets } = useSelector((state) => state.ticketList);
    const { loading: creating, success } = useSelector((state) => state.ticketCreate);

    const [selectedServiceId, setSelectedServiceId] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(ticketSchema),
        mode: "onBlur",
        defaultValues: {
            service: "",
            watchBrand: "",
            watchModel: "",
            problemDescription: ""
        }
    });

    useEffect(() => {
        dispatch(getServices());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getMyTickets());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (success) {
            toast.success("Your support ticket has been opened.");
            dispatch({ type: TICKET_CREATE_RESET });
            reset({ service: "", watchBrand: "", watchModel: "", problemDescription: "" });
            setSelectedServiceId("");
            dispatch(getMyTickets());
        }
    }, [success, dispatch, reset]);

    const handleSelectService = (service) => {
        setSelectedServiceId(service._id);
        setValue("service", service._id, { shouldValidate: true });
        const formEl = document.getElementById("ticket-form");
        if (formEl) {
            formEl.scrollIntoView({ behavior: "smooth" });
        }
    };

    const onSubmit = (data) => {
        dispatch(createTicket(data));
    };

    return (
        <main className="sell-page page-enter">
            <SiteHeader variant="solid" />

            <div className="sell-container">
                <div className="sell-heading">
                    <p className="eyebrow">SERVICES &amp; AFTERCARE</p>
                    <h1>Keep your timepiece in its best condition</h1>
                    <p className="auth-description">
                        Expert cleaning, escapement calibration, and movement restoration carried out by our master watchmakers.
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {loading ? (
                    <div className="service-grid">
                        {[1, 2, 3].map((n) => (
                            <div key={n} style={{ height: "180px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                        ))}
                    </div>
                ) : (
                    <div className="service-grid">
                        {services.map((service) => (
                            <article
                                className={`service-card ${selectedServiceId === service._id ? "is-selected" : ""}`}
                                key={service._id}
                                style={{
                                    borderColor: selectedServiceId === service._id ? "var(--gold)" : undefined,
                                    cursor: "pointer"
                                }}
                                onClick={() => handleSelectService(service)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <h3>{service.name}</h3>
                                    {selectedServiceId === service._id && (
                                        <span className="badge verified-badge">Selected</span>
                                    )}
                                </div>
                                <p>{service.description}</p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                                    <strong className="service-price">{formatPrice(service.price)}</strong>
                                    <button
                                        type="button"
                                        className="gold-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectService(service);
                                        }}
                                    >
                                        Book Service
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <section className="ticket-section" id="ticket-form" style={{ marginTop: "3.5rem" }}>
                    <h2>Open a support ticket</h2>
                    <p className="auth-description">
                        Tell us what is wrong with the watch and our horology atelier will inspect it.
                    </p>

                    {!isAuthenticated ? (
                        <div style={{ textAlign: "center", padding: "2rem", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "1.2rem" }}>
                                You must be signed in to request maintenance or open a service ticket.
                            </p>
                            <Link className="gold-button" to="/login">
                                Sign in to open a ticket
                            </Link>
                        </div>
                    ) : !user?.isVerified ? (
                        <div className="auth-error" style={{ textAlign: "center", padding: "1.5rem" }}>
                            ⚠ <strong>Verification Required:</strong> Please verify your email before opening a support ticket.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
                            <label>
                                Service
                                <select
                                    {...register("service")}
                                    className="catalog-select"
                                    value={selectedServiceId}
                                    onChange={(e) => {
                                        setSelectedServiceId(e.target.value);
                                        setValue("service", e.target.value, { shouldValidate: true });
                                    }}
                                    aria-invalid={Boolean(errors.service)}
                                >
                                    <option value="">Choose a service</option>
                                    {services.map((service) => (
                                        <option key={service._id} value={service._id}>
                                            {service.name} ({formatPrice(service.price)})
                                        </option>
                                    ))}
                                </select>
                                {errors.service && <span className="field-error">{errors.service.message}</span>}
                            </label>

                            <div className="form-row-2">
                                <label>
                                    Watch brand
                                    <input
                                        {...register("watchBrand")}
                                        placeholder="e.g. Seiko"
                                        aria-invalid={Boolean(errors.watchBrand)}
                                    />
                                    {errors.watchBrand && <span className="field-error">{errors.watchBrand.message}</span>}
                                </label>
                                <label>
                                    Watch model
                                    <input
                                        {...register("watchModel")}
                                        placeholder="e.g. Presage Cocktail Time"
                                        aria-invalid={Boolean(errors.watchModel)}
                                    />
                                    {errors.watchModel && <span className="field-error">{errors.watchModel.message}</span>}
                                </label>
                            </div>

                            <label>
                                Problem description
                                <textarea
                                    rows={4}
                                    {...register("problemDescription")}
                                    placeholder="Describe the issue, for example the watch loses about two minutes a day."
                                    aria-invalid={Boolean(errors.problemDescription)}
                                />
                                {errors.problemDescription && <span className="field-error">{errors.problemDescription.message}</span>}
                            </label>

                            <div className="modal-actions">
                                <button type="submit" className="gold-button" disabled={creating}>
                                    {creating ? "Opening ticket..." : "Open ticket"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {isAuthenticated && tickets.length > 0 && (
                    <section className="ticket-section" style={{ marginTop: "3.5rem" }}>
                        <h2>Your tickets</h2>
                        <div className="ticket-list">
                            {tickets.map((ticket) => (
                                <article className="ticket-card" key={ticket._id}>
                                    <div className="ticket-head">
                                        <strong>{ticket.ticketNumber}</strong>
                                        <span className="badge verified-badge">{ticket.status}</span>
                                    </div>
                                    <p className="appraisal-meta">
                                        {ticket.service?.name} &bull; {ticket.watchBrand} {ticket.watchModel}
                                    </p>
                                    <p className="appraisal-meta">{ticket.problemDescription}</p>

                                    <ol className="ticket-timeline">
                                        {(ticket.statusHistory || []).map((entry, index) => (
                                            <li key={`${entry.status}-${index}`}>
                                                <span className="timeline-dot" />
                                                <div>
                                                    <strong>{entry.status}</strong>
                                                    <span>
                                                        {new Date(entry.changedAt).toLocaleString("en-PH")}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <SiteFooter />
        </main>
    );
}

export default ServicesPage;
