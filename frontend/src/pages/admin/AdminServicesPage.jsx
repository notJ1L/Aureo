import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import { confirmAction } from "../../utils/sweetAlert";
import AdminHeader from "../../components/layout/AdminHeader";

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
    const [form, setForm] = useState(EMPTY_FORM);

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
            setForm(EMPTY_FORM);
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
            toast.success("Service removed");
            dispatch({ type: SERVICE_DELETE_RESET });
        } else {
            toast.success("Bulk delete complete");
            dispatch({ type: SERVICE_BULK_DELETE_RESET });
        }

        dispatch(getAdminServices());
    }, [mutationKey, dispatch]);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleOpenCreate = () => {
        setEditingService(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        setForm({
            name: service.name,
            description: service.description,
            price: service.price
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (Number(form.price) <= 0) {
            toast.error("The service price must be a positive number.");
            return;
        }

        if (editingService) {
            dispatch(updateService(editingService._id, form));
        } else {
            dispatch(createService(form));
        }
    };

    const handleDelete = async (service) => {
        const confirmed = await confirmAction({
            title: "Remove this service?",
            message: `"${service.name}" will no longer be offered on the storefront.`,
            confirmText: "Remove service"
        });

        if (confirmed) {
            dispatch(deleteService(service._id));
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
        const allIds = (services || []).map((service) => service._id);
        const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

        setSelectedIds(allSelected ? [] : allIds);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warn("Select at least one service first.");
            return;
        }

        const confirmed = await confirmAction({
            title: `Delete ${selectedIds.length} selected service(s)?`,
            message: "The services will no longer be offered on the storefront.",
            confirmText: "Delete selected"
        });

        if (confirmed) {
            dispatch(bulkDeleteServices(selectedIds));
        }
    };

    return (
        <main className="admin-page">
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

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span>{selectedIds.length} service(s) selected</span>
                        <button
                            type="button"
                            className="admin-btn del-btn"
                            onClick={handleBulkDelete}
                            disabled={mutationLoading}
                        >
                            {mutationLoading ? "Deleting..." : "Delete selected"}
                        </button>
                        <button
                            type="button"
                            className="outline-button"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {loading && <p className="catalog-message">Loading services...</p>}

                {!loading && (services || []).length === 0 && (
                    <div className="empty-state">
                        <p>No services yet.</p>
                        <span>Add the first aftercare service of the vault.</span>
                    </div>
                )}

                {(services || []).length > 0 && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="admin-select-cell">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all services"
                                            checked={
                                                (services || []).length > 0 &&
                                                selectedIds.length === (services || []).length
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Service</th>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <tr key={service._id} className={isSelected(service._id) ? "admin-row-selected" : ""}>
                                        <td className="admin-select-cell">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${service.name}`}
                                                checked={isSelected(service._id)}
                                                onChange={() => handleToggleSelect(service._id)}
                                            />
                                        </td>
                                        <td><strong>{service.name}</strong></td>
                                        <td>{service.description}</td>
                                        <td>{formatPrice(service.price)}</td>
                                        <td>
                                            <div className="admin-action-cell">
                                                <button
                                                    type="button"
                                                    className="admin-btn edit-btn"
                                                    onClick={() => handleOpenEdit(service)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-btn del-btn"
                                                    onClick={() => handleDelete(service)}
                                                >
                                                    Delete
                                                </button>
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

                        <form onSubmit={handleSubmit} className="admin-form">
                            <label>
                                Service name
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Watch Cleaning"
                                    required
                                />
                            </label>

                            <label>
                                Description
                                <textarea
                                    rows={3}
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="What is included in this service?"
                                    required
                                />
                            </label>

                            <label>
                                Price (PHP)
                                <input
                                    type="number"
                                    step="1"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="1500"
                                    required
                                />
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
