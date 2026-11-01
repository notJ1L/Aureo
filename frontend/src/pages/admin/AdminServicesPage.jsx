import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import {
    getAdminServices,
    createService,
    updateService,
    deleteService,
    bulkDeleteServices
} from "../../redux/actions/serviceActions";
import {
    SERVICE_CREATE_RESET,
    SERVICE_UPDATE_RESET,
    SERVICE_DELETE_RESET,
    SERVICE_BULK_DELETE_RESET
} from "../../redux/constants/serviceConstants";
import { serviceSchema } from "../../utils/validationSchemas";
import { confirmAction } from "../../utils/sweetAlert";
import AdminHeader from "../../components/layout/AdminHeader";
import { AureoCheckbox } from "../../components/ui";
import {
    IconTool,
    IconSparkle,
    IconWallet,
    IconBox
} from "../../components/layout/icons";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

const EMPTY_FORM = { name: "", description: "", price: "" };

function AdminServicesPage() {
    const dispatch = useDispatch();
    const { services, loading, error } = useSelector((state) => state.serviceList);
    const {
        loading: mutationLoading,
        success,
        isUpdated,
        isDeleted,
        isBulkDeleted,
        error: mutationError
    } = useSelector((state) => state.serviceMutation);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeTab, setActiveTab] = useState("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(serviceSchema),
        mode: "onBlur",
        defaultValues: EMPTY_FORM
    });

    useEffect(() => {
        dispatch(getAdminServices());
    }, [dispatch]);

    const mutationKey = success
        ? "create"
        : isUpdated
          ? "update"
          : isDeleted
            ? "delete"
            : isBulkDeleted
              ? "bulk"
              : null;

    const [handledMutation, setHandledMutation] = useState(null);

    if (mutationKey && mutationKey !== handledMutation) {
        setHandledMutation(mutationKey);

        if (mutationKey === "create" || mutationKey === "update") {
            setIsModalOpen(false);
            reset(EMPTY_FORM);
            setEditingService(null);
        }

        if (mutationKey === "bulk") {
            setSelectedIds([]);
        }
    } else if (!mutationKey && handledMutation) {
        setHandledMutation(null);
    }

    useEffect(() => {
        if (!mutationKey) {
            return;
        }

        if (mutationKey === "create") {
            toast.success("Service created");
            dispatch({ type: SERVICE_CREATE_RESET });
        } else if (mutationKey === "update") {
            toast.success("Service updated");
            dispatch({ type: SERVICE_UPDATE_RESET });
        } else if (mutationKey === "delete") {
            toast.success("Service deactivated (soft deleted)");
            dispatch({ type: SERVICE_DELETE_RESET });
        } else {
            toast.success("Bulk deactivation complete");
            dispatch({ type: SERVICE_BULK_DELETE_RESET });
        }

        dispatch(getAdminServices());
    }, [mutationKey, dispatch]);

    const counts = {
        total: (services || []).length,
        active: (services || []).filter((s) => s.isActive !== false).length,
        archived: (services || []).filter((s) => s.isActive === false).length
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder(field === "name" ? "asc" : "desc");
        }
    };

    const filteredServices = (services || [])
        .filter((s) => {
            if (activeTab === "active" && s.isActive === false) return false;
            if (activeTab === "archived" && s.isActive !== false) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesName = (s.name || "").toLowerCase().includes(q);
                const matchesDesc = (s.description || "").toLowerCase().includes(q);
                return matchesName || matchesDesc;
            }
            return true;
        })
        .sort((a, b) => {
            let comp = 0;
            if (sortField === "price") {
                comp = (Number(a.price) || 0) - (Number(b.price) || 0);
            } else {
                comp = (a.name || "").localeCompare(b.name || "");
            }
            return sortOrder === "asc" ? comp : -comp;
        });

    const handleOpenCreate = () => {
        setEditingService(null);
        reset(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        reset({
            name: service.name,
            description: service.description,
            price: service.price
        });
        setIsModalOpen(true);
    };

    const onSubmit = (data) => {
        if (editingService) {
            dispatch(updateService(editingService._id, data));
        } else {
            dispatch(createService(data));
        }
    };

    const handleToggleActive = async (service) => {
        const isCurrentlyActive = service.isActive !== false;

        if (isCurrentlyActive) {
            const confirmed = await confirmAction({
                title: `Deactivate service "${service.name}"?`,
                message: "This service will be hidden from the storefront, but existing ticket history is preserved. You can restore it anytime.",
                confirmText: "Deactivate Service",
                danger: true
            });

            if (confirmed) {
                dispatch(deleteService(service._id));
            }
        } else {
            const confirmed = await confirmAction({
                title: `Restore service "${service.name}"?`,
                message: "This service will be reactivated and offered on the storefront again.",
                confirmText: "Restore Service",
                danger: false
            });

            if (confirmed) {
                dispatch(updateService(service._id, { isActive: true }));
            }
        }
    };

    const isSelected = (id) => selectedIds.includes(id);

    const handleToggleSelect = (id) => {
        setSelectedIds((previous) =>
            previous.includes(id)
                ? previous.filter((selectedId) => selectedId !== id)
                : [...previous, id]
        );
    };

    const handleSelectAll = () => {
        const allIds = filteredServices.map((service) => service._id);
        const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

        setSelectedIds(allSelected ? [] : allIds);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warn("Select at least one service first.");
            return;
        }

        const confirmed = await confirmAction({
            title: `Deactivate ${selectedIds.length} selected service(s)?`,
            message: "The services will be hidden from the storefront, but all history is preserved.",
            confirmText: "Deactivate Selected",
            danger: true
        });

        if (confirmed) {
            dispatch(bulkDeleteServices(selectedIds));
        }
    };

    return (
        <main className="admin-page page-enter">
            <AdminHeader />

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">SERVICE CATALOG</p>
                        <h1>Aftercare Services</h1>
                    </div>
                    <button type="button" className="gold-button" onClick={handleOpenCreate}>
                        + Add Service
                    </button>
                </div>

                {/* Metric Summary Cards */}
                <div className="vault-metrics-grid" style={{ marginBottom: "2rem" }}>
                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Total Services</span>
                            <div className="vault-metric-icon"><IconTool /></div>
                        </div>
                        <div className="vault-metric-val">{counts.total}</div>
                        <span className="vault-metric-hint">Registered atelier maintenance offerings</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Active Catalog</span>
                            <div className="vault-metric-icon"><IconSparkle /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "#4ade80" }}>{counts.active}</div>
                        <span className="vault-metric-hint">Bookable on storefront & support desk</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Average Service Fee</span>
                            <div className="vault-metric-icon"><IconWallet /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "var(--gold)" }}>
                            {formatPrice(
                                counts.total
                                    ? (services || []).reduce((sum, s) => sum + (s.price || 0), 0) / counts.total
                                    : 0
                            )}
                        </div>
                        <span className="vault-metric-hint">Standard calibration & maintenance rate</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Archived Services</span>
                            <div className="vault-metric-icon"><IconBox /></div>
                        </div>
                        <div className="vault-metric-val">{counts.archived}</div>
                        <span className="vault-metric-hint">Deactivated historical service records</span>
                    </article>
                </div>

                {/* Status Tabs & Filter/Search Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    <div className="admin-status-tabs" style={{ marginBottom: 0 }}>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "active" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("active")}
                        >
                            Active <span className="admin-tab-count">{counts.active}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "archived" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("archived")}
                        >
                            Archived <span className="admin-tab-count">{counts.archived}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All Services <span className="admin-tab-count">{counts.total}</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                        <select
                            className="admin-filter-select"
                            value={`${sortField}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split("-");
                                setSortField(field);
                                setSortOrder(order);
                            }}
                            aria-label="Sort services"
                        >
                            <option value="name-asc">Name: A to Z</option>
                            <option value="name-desc">Name: Z to A</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="price-asc">Price: Low to High</option>
                        </select>

                        <input
                            type="text"
                            className="catalog-input"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: "220px", padding: "0.45rem 0.8rem", fontSize: "0.82rem" }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="outline-button"
                                onClick={() => setSearchQuery("")}
                                style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span>{selectedIds.length} service(s) selected</span>
                        <button type="button" className="admin-btn del-btn" onClick={handleBulkDelete}>
                            Deactivate Selected
                        </button>
                    </div>
                )}

                {loading ? (
                    <div style={{ height: "300px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "40px" }}>
                                        <AureoCheckbox
                                            inputProps={{ "aria-label": "Select all services" }}
                                            checked={
                                                filteredServices.length > 0 &&
                                                filteredServices.every((s) => selectedIds.includes(s._id))
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th
                                        className={`sortable-th ${sortField === "name" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("name")}
                                        title="Click to sort by Name"
                                    >
                                        Service
                                        <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th>Description</th>
                                    <th
                                        className={`sortable-th ${sortField === "price" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("price")}
                                        title="Click to sort by Price"
                                    >
                                        Price
                                        <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.map((service) => (
                                    <tr key={service._id} className={isSelected(service._id) ? "row-selected" : ""}>
                                        <td>
                                            <AureoCheckbox
                                                inputProps={{ "aria-label": `Select ${service.name}` }}
                                                checked={isSelected(service._id)}
                                                onChange={() => handleToggleSelect(service._id)}
                                            />
                                        </td>
                                        <td>
                                            <strong>{service.name}</strong>
                                        </td>
                                        <td className="admin-desc-cell">{service.description}</td>
                                        <td>
                                            <strong className="text-gold">{formatPrice(service.price)}</strong>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "0.2rem 0.55rem",
                                                    borderRadius: "4px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    background: service.isActive !== false ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                                    color: service.isActive !== false ? "#4ade80" : "#f87171",
                                                    border: service.isActive !== false ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                                                }}
                                            >
                                                {service.isActive !== false ? "Active" : "Archived"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    type="button"
                                                    className="admin-btn edit-btn"
                                                    onClick={() => handleOpenEdit(service)}
                                                >
                                                    Edit
                                                </button>
                                                {service.isActive === false ? (
                                                    <button
                                                        type="button"
                                                        className="admin-btn restore-btn"
                                                        onClick={() => handleToggleActive(service)}
                                                        title="Restore to storefront"
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="admin-btn del-btn"
                                                        onClick={() => handleToggleActive(service)}
                                                        title="Deactivate service"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-head">
                            <h2>{editingService ? "Edit Service" : "Add Service"}</h2>
                            <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
                            <label>
                                Service name
                                <input
                                    {...register("name")}
                                    placeholder="e.g. Watch Cleaning"
                                    aria-invalid={Boolean(errors.name)}
                                />
                                {errors.name && <span className="field-error">{errors.name.message}</span>}
                            </label>

                            <label>
                                Description
                                <textarea
                                    rows={3}
                                    {...register("description")}
                                    placeholder="What is included in this service?"
                                    aria-invalid={Boolean(errors.description)}
                                />
                                {errors.description && <span className="field-error">{errors.description.message}</span>}
                            </label>

                            <label>
                                Price (PHP)
                                <input
                                    type="number"
                                    step="1"
                                    {...register("price")}
                                    placeholder="1500"
                                    aria-invalid={Boolean(errors.price)}
                                />
                                {errors.price && <span className="field-error">{errors.price.message}</span>}
                                <span className="field-hint">The price must be greater than zero.</span>
                            </label>

                            <div className="modal-actions">
                                <button type="button" className="outline-button" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="gold-button" disabled={mutationLoading}>
                                    {mutationLoading
                                        ? "Processing..."
                                        : editingService
                                          ? "Save Changes"
                                          : "Create Service"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AdminServicesPage;
