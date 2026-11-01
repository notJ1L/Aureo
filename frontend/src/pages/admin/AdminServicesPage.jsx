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
            toast.success("Service removed");
            dispatch({ type: SERVICE_DELETE_RESET });
        } else {
            toast.success("Bulk delete complete");
            dispatch({ type: SERVICE_BULK_DELETE_RESET });
        }

        dispatch(getAdminServices());
    }, [mutationKey, dispatch]);

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

    const handleDelete = async (service) => {
        const confirmed = await confirmAction({
            title: "Remove this service?",
            message: `"${service.name}" will no longer be offered on the storefront.`,
            confirmText: "Remove service",
            danger: true
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
            confirmText: "Delete selected",
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

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span>{selectedIds.length} service(s) selected</span>
                        <button type="button" className="admin-btn del-btn" onClick={handleBulkDelete}>
                            Delete Selected
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
                                        <input
                                            type="checkbox"
                                            checked={
                                                (services || []).length > 0 &&
                                                (services || []).every((s) => selectedIds.includes(s._id))
                                            }
                                            onChange={handleSelectAll}
                                            aria-label="Select all services"
                                        />
                                    </th>
                                    <th>Service</th>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(services || []).map((service) => (
                                    <tr key={service._id} className={isSelected(service._id) ? "row-selected" : ""}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isSelected(service._id)}
                                                onChange={() => handleToggleSelect(service._id)}
                                                aria-label={`Select ${service.name}`}
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
                                            <div className="admin-actions">
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
