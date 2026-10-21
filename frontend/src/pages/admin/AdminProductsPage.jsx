import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts
} from "../../redux/actions/productActions";
import {
    PRODUCT_CREATE_RESET,
    PRODUCT_UPDATE_RESET,
    PRODUCT_DELETE_RESET,
    PRODUCT_BULK_DELETE_RESET
} from "../../redux/constants/productConstants";
import { confirmAction } from "../../utils/sweetAlert";
import { ValidatedField } from "../../components/ui/ValidatedField";
import { productSchema } from "../../utils/validationSchemas";

const CATEGORY_OPTIONS = [
    { value: "dress", label: "Dress" },
    { value: "diver", label: "Diver" },
    { value: "chronograph", label: "Chronograph" },
    { value: "sports", label: "Sports" },
    { value: "luxury", label: "Luxury" }
];

const EMPTY_PRODUCT = {
    name: "",
    brand: "",
    category: "dress",
    movement: "automatic",
    caseSize: 40,
    condition: "new",
    price: 0,
    stock: 5,
    description: ""
};

function AdminProductsPage() {
    const dispatch = useDispatch();
    const { products, error } = useSelector((state) => state.adminProducts);
    const {
        loading: mutationLoading,
        success,
        isUpdated,
        isDeleted,
        isBulkDeleted,
        error: mutationError
    } = useSelector((state) => state.productMutation);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Unit 1: the product form is validated with Yup through React Hook Form.
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(productSchema),
        mode: "onBlur",
        defaultValues: EMPTY_PRODUCT
    });

    const watchedCondition = useWatch({ control, name: "condition" });

    // The uploaded images are kept outside the form schema because they are
    // base64 previews that are uploaded to Cloudinary on submit.
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const resetForm = () => {
        reset(EMPTY_PRODUCT);
        setImages([]);
        setImagePreviews([]);
        setEditingProduct(null);
    };

    useEffect(() => {
        dispatch(getAdminProducts());
    }, [dispatch]);

    // The mutation result is a Redux flag, so the local form state is
    // adjusted while rendering instead of inside an effect.
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
            resetForm();
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
            toast.success("Product created successfully");
            dispatch({ type: PRODUCT_CREATE_RESET });
        } else if (mutationKey === "update") {
            toast.success("Product updated successfully");
            dispatch({ type: PRODUCT_UPDATE_RESET });
        } else if (mutationKey === "delete") {
            toast.success("Product removed or deactivated");
            dispatch({ type: PRODUCT_DELETE_RESET });
        } else {
            toast.success("Bulk delete complete");
            dispatch({ type: PRODUCT_BULK_DELETE_RESET });
        }

        dispatch(getAdminProducts());
    }, [mutationKey, dispatch]);

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        reset({
            name: prod.name,
            brand: prod.brand,
            category: prod.category || "dress",
            movement: prod.movement,
            caseSize: prod.caseSize,
            condition: prod.condition,
            price: prod.price,
            stock: prod.stock,
            description: prod.description
        });
        setImages(prod.images || []);
        setImagePreviews(prod.images?.map((i) => i.url) || []);
        setIsModalOpen(true);
    };

    // FR 2.2: a second-hand piece is a single unit, so the stock field is
    // locked to 1 whenever the condition changes.
    const handleConditionChange = (value) => {
        setValue("condition", value, { shouldValidate: true });

        if (value === "second-hand") {
            setValue("stock", 1);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newImages = [...images];
        const newPreviews = [...imagePreviews];

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    newImages.push(reader.result);
                    newPreviews.push(reader.result);
                    setImagePreviews([...newPreviews]);
                    setImages([...newImages]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const onSubmit = (values) => {
        const payload = { ...values, images };

        // Enforce FR 2.2: Second-hand stock must be 1 (or 0 if sold)
        if (values.condition === "second-hand" && !editingProduct && Number(values.stock) !== 1) {
            toast.error("Second-hand timepieces must have a stock of exactly 1.");
            return;
        }

        if (editingProduct) {
            dispatch(updateProduct(editingProduct._id, payload));
        } else {
            dispatch(createProduct(payload));
        }
    };

    const handleToggleActive = async (prod) => {
        if (prod.isActive) {
            const confirmed = await confirmAction({
                title: "Archive this timepiece?",
                message: `"${prod.name}" will be hidden from the public catalog. Existing orders keep their record.`,
                confirmText: "Archive"
            });

            if (confirmed) {
                dispatch(deleteProduct(prod._id));
            }
        } else {
            const confirmed = await confirmAction({
                title: "Restore this timepiece?",
                message: `"${prod.name}" will return to the public catalog.`,
                confirmText: "Restore",
                danger: false
            });

            if (confirmed) {
                dispatch(updateProduct(prod._id, { isActive: true }));
            }
        }
    };

    // MP1: checkbox selection for the admin datatable.
    const isSelected = (id) => selectedIds.includes(id);

    const handleToggleSelect = (id) => {
        setSelectedIds((previous) =>
            previous.includes(id)
                ? previous.filter((selectedId) => selectedId !== id)
                : [...previous, id]
        );
    };

    const handleSelectAll = () => {
        const allIds = (products || []).map((product) => product._id);
        const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

        setSelectedIds(allSelected ? [] : allIds);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warn("Select at least one timepiece first.");
            return;
        }

        const confirmed = await confirmAction({
            title: `Delete ${selectedIds.length} selected timepiece(s)?`,
            message:
                "Timepieces that already appear in an order are archived instead of removed.",
            confirmText: "Delete selected"
        });

        if (confirmed) {
            dispatch(bulkDeleteProducts(selectedIds));
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    return (
        <main className="admin-page">
            <header className="admin-header-bar">
                <div>
                    <Link to="/" className="logo">AUREO</Link>
                    <span className="admin-tag">ADMIN VAULT</span>
                </div>
                <div className="admin-nav-actions">
                    <Link to="/catalog" className="outline-button">View Storefront</Link>
                    <Link to="/me" className="nav-action">Account</Link>
                </div>
            </header>

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">INVENTORY CONTROL</p>
                        <h1>Watch Inventory & Listings</h1>
                    </div>
                    <button type="button" className="gold-button" onClick={handleOpenCreate}>
                        + Add New Timepiece
                    </button>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span>
                            {selectedIds.length} timepiece(s) selected
                        </span>
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

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="admin-select-cell">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all timepieces"
                                        checked={
                                            (products || []).length > 0 &&
                                            selectedIds.length === (products || []).length
                                        }
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Photo</th>
                                <th>Name & Brand</th>
                                <th>Movement</th>
                                <th>Condition</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(products || []).map((prod) => (
                                <tr key={prod._id} className={isSelected(prod._id) ? "admin-row-selected" : ""}>
                                    <td className="admin-select-cell">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select ${prod.name}`}
                                            checked={isSelected(prod._id)}
                                            onChange={() => handleToggleSelect(prod._id)}
                                        />
                                    </td>
                                    <td>
                                        <img
                                            src={prod.images?.[0]?.url || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=100&q=80"}
                                            alt={prod.name}
                                            className="admin-table-thumb"
                                        />
                                    </td>
                                    <td>
                                        <strong>{prod.name}</strong>
                                        <span className="admin-subtext">{prod.brand}</span>
                                    </td>
                                    <td>{prod.movement} ({prod.caseSize}mm)</td>
                                    <td>
                                        <span className={`badge ${prod.condition === "second-hand" ? "preowned-badge" : "new-badge"}`}>
                                            {prod.condition}
                                        </span>
                                    </td>
                                    <td>{formatPrice(prod.price)}</td>
                                    <td>
                                        <strong>{prod.stock}</strong>
                                        {prod.condition === "second-hand" && <span className="single-unit-pill">Single unit</span>}
                                    </td>
                                    <td>
                                        <span className={`badge ${prod.isActive ? "verified-badge" : "unverified-badge"}`}>
                                            {prod.isActive ? "Active" : "Archived"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-action-cell">
                                            <button
                                                type="button"
                                                className="admin-btn edit-btn"
                                                onClick={() => handleOpenEdit(prod)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-btn ${prod.isActive ? "del-btn" : "edit-btn"}`}
                                                onClick={() => handleToggleActive(prod)}
                                            >
                                                {prod.isActive ? "Deactivate" : "Restore"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-head">
                            <h2>{editingProduct ? "Edit Timepiece" : "Add Timepiece to Vault"}</h2>
                            <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="admin-form" noValidate>
                            <div className="form-row-2">
                                <ValidatedField
                                    control={control}
                                    name="name"
                                    label="Watch Name"
                                    placeholder="e.g. Submariner Date 41"
                                    error={errors.name?.message}
                                />
                                <ValidatedField
                                    control={control}
                                    name="brand"
                                    label="Brand"
                                    placeholder="e.g. Rolex"
                                    error={errors.brand?.message}
                                />
                            </div>

                            <div className="form-row-3">
                                <ValidatedField
                                    control={control}
                                    name="movement"
                                    label="Movement"
                                    options={[
                                        { value: "automatic", label: "Automatic" },
                                        { value: "manual", label: "Manual" },
                                        { value: "quartz", label: "Quartz" }
                                    ]}
                                    error={errors.movement?.message}
                                />
                                <ValidatedField
                                    control={control}
                                    name="category"
                                    label="Category"
                                    options={CATEGORY_OPTIONS}
                                    error={errors.category?.message}
                                />
                                <ValidatedField
                                    control={control}
                                    name="caseSize"
                                    label="Case Size (mm)"
                                    type="number"
                                    error={errors.caseSize?.message}
                                />
                            </div>

                            <div className="form-row-3">
                                <ValidatedField
                                    control={control}
                                    name="condition"
                                    label="Condition"
                                    options={[
                                        { value: "new", label: "Brand New" },
                                        { value: "second-hand", label: "Second-hand (Pre-owned)" }
                                    ]}
                                    onValueChange={handleConditionChange}
                                    error={errors.condition?.message}
                                />
                                <ValidatedField
                                    control={control}
                                    name="price"
                                    label="Price (PHP)"
                                    type="number"
                                    error={errors.price?.message}
                                />
                                <ValidatedField
                                    control={control}
                                    name="stock"
                                    label="Stock"
                                    type="number"
                                    disabled={watchedCondition === "second-hand"}
                                    hint={watchedCondition === "second-hand" ? "Locked to 1 for second-hand items (FR 2.2)" : undefined}
                                    error={errors.stock?.message}
                                />
                            </div>

                            <ValidatedField
                                control={control}
                                name="description"
                                label="Description & Provenance"
                                type="textarea"
                                rows={4}
                                placeholder="Details on movement, archival history, box/papers..."
                                error={errors.description?.message}
                            />

                            <label>
                                Timepiece Photographs
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                            </label>

                            {imagePreviews.length > 0 && (
                                <div className="modal-preview-grid">
                                    {imagePreviews.map((src, i) => (
                                        <img key={i} src={src} alt="Preview" className="modal-thumb" />
                                    ))}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="outline-button" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="gold-button" disabled={mutationLoading}>
                                    {mutationLoading ? "Processing..." : editingProduct ? "Save Changes" : "Create Listing"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AdminProductsPage;
