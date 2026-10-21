import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getServices, getMyTickets, createTicket } from "../redux/actions/serviceActions";
import { TICKET_CREATE_RESET } from "../redux/constants/serviceConstants";

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

    const [form, setForm] = useState({
        service: "",
        watchBrand: "",
        watchModel: "",
        problemDescription: ""
    });

    // The form is cleared while rendering when a ticket was created.
    const [handledSuccess, setHandledSuccess] = useState(false);

    if (success && !handledSuccess) {
        setHandledSuccess(true);
        setForm({ service: "", watchBrand: "", watchModel: "", problemDescription: "" });
    } else if (!success && handledSuccess) {
        setHandledSuccess(false);
    }

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
            dispatch(getMyTickets());
        }
    }, [success, dispatch]);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!form.service) {
            toast.error("Please choose a service first.");
            return;
        }

        dispatch(createTicket(form));
    };

    return (
        <main className="sell-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>
                <nav className="nav-links">
                    <Link to="/catalog">Collection</Link>
                    <Link to="/sell">Sell your watch</Link>
                    <Link to="/services">Services</Link>
                    <Link to="/appraisals">Appraisals</Link>
                </nav>
                <div className="nav-actions">
                    {isAuthenticated ? (
                        <Link className="nav-action" to="/me" style={{ color: "var(--gold)" }}>
                            {user?.name?.split(" ")[0] || "Account"}
                        </Link>
                    ) : (
                        <Link className="nav-action" to="/login">Sign in</Link>
                    )}
                </div>
            </header>

            <div className="sell-container">
                <div className="sell-heading">
                    <p className="eyebrow">SERVICES &amp; AFTERCARE</p>
                    <h1>Keep your timepiece in its best condition</h1>
                    <p className="auth-description">
                        Cleaning, repair and adjustment carried out by our watchmakers.
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {loading && <p className="catalog-message">Loading the services...</p>}

                <div className="service-grid">
                    {services.map((service) => (
                        <article className="service-card" key={service._id}>
                            <h3>{service.name}</h3>
                            <p>{service.description}</p>
                            <strong className="service-price">{formatPrice(service.price)}</strong>
                        </article>
                    ))}
                </div>

                <section className="ticket-section">
                    <h2>Open a support ticket</h2>
                    <p className="auth-description">
                        Tell us what is wrong with the watch and we will take it from there.
                    </p>

                    {!isAuthenticated ? (
                        <Link className="gold-button" to="/login" style={{ display: "inline-block", textAlign: "center" }}>
                            Sign in to open a ticket
                        </Link>
                    ) : !user?.isVerified ? (
                        <div className="auth-info">
                            Please verify your email before opening a support ticket.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="admin-form">
                            <label>
                                Service
                                <select
                                    name="service"
                                    value={form.service}
                                    onChange={handleChange}
                                    className="catalog-select"
                                    required
                                >
                                    <option value="">Choose a service</option>
                                    {services.map((service) => (
                                        <option key={service._id} value={service._id}>
                                            {service.name} ({formatPrice(service.price)})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="form-row-2">
                                <label>
                                    Watch brand
                                    <input
                                        name="watchBrand"
                                        value={form.watchBrand}
                                        onChange={handleChange}
                                        placeholder="e.g. Seiko"
                                        required
                                    />
                                </label>
                                <label>
                                    Watch model
                                    <input
                                        name="watchModel"
                                        value={form.watchModel}
                                        onChange={handleChange}
                                        placeholder="e.g. Presage Cocktail Time"
                                        required
                                    />
                                </label>
                            </div>

                            <label>
                                Problem description
                                <textarea
                                    rows={4}
                                    name="problemDescription"
                                    value={form.problemDescription}
                                    onChange={handleChange}
                                    placeholder="Describe the issue, for example the watch loses about two minutes a day."
                                    required
                                />
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
                    <section className="ticket-section">
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
        </main>
    );
}

export default ServicesPage;
