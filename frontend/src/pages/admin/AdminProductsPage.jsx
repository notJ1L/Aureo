import { compressImage } from "../../utils/imageCompressor";
import ModalPortal from "../../components/ui/ModalPortal";
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
    bulkDeleteProducts,
    bulkUpdateProductStatus
} from "../../redux/actions/productActions";
import {
    PRODUCT_CREATE_RESET,
    PRODUCT_UPDATE_RESET,
    PRODUCT_DELETE_RESET,
    PRODUCT_BULK_DELETE_RESET,
    PRODUCT_BULK_STATUS_RESET
} from "../../redux/constants/productConstants";
import { confirmAction } from "../../utils/sweetAlert";
import api from "../../services/api";
import { ValidatedField } from "../../components/ui/ValidatedField";
import { StatusBadge, AureoCheckbox, AureoSelect } from "../../components/ui";
import { productSchema } from "../../utils/validationSchemas";
import AdminHeader from "../../components/layout/AdminHeader";
import {
    IconWatch,
    IconBox,
    IconSparkle,
    IconWallet
} from "../../components/layout/icons";

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
    price: "",
    stock: 5,
    description: ""
};

const PRODUCT_ACTION_STYLE = {
    height: "32px",
    padding: "4px 12px",
    border: "1px solid var(--gold)",
    borderRadius: "4px",
    background: "transparent",
    color: "var(--gold)",
    fontSize: "0.8rem",
    whiteSpace: "nowrap"
};

const PRODUCT_DANGER_ACTION_STYLE = {
    ...PRODUCT_ACTION_STYLE,
    borderColor: "#e53935",
    color: "#e53935"
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
        isBulkStatusUpdated,
        message: mutationMsg,
        error: mutationError
    } = useSelector((state) => state.productMutation);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [conditionFilter, setConditionFilter] = useState("");
    const [stockFilter, setStockFilter] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");

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
                    : isBulkStatusUpdated
                        ? "bulk-status"
                        : null;

    const [handledMutation, setHandledMutation] = useState(null);

    if (mutationKey && mutationKey !== handledMutation) {
        setHandledMutation(mutationKey);

        if (mutationKey === "create" || mutationKey === "update") {
            setIsModalOpen(false);
            resetForm();
        }

        if (mutationKey === "bulk" || mutationKey === "bulk-status") {
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
            toast.success("Timepiece updated successfully");
            dispatch({ type: PRODUCT_UPDATE_RESET });
        } else if (mutationKey === "delete") {
            toast.success("Timepiece removed from vault");
            dispatch({ type: PRODUCT_DELETE_RESET });
        } else if (mutationKey === "bulk-status") {
            toast.success(mutationMsg || "Timepieces updated successfully");
            dispatch({ type: PRODUCT_BULK_STATUS_RESET });
        } else {
            toast.success(mutationMsg || "Bulk delete complete");
            dispatch({ type: PRODUCT_BULK_DELETE_RESET });
        }

        dispatch(getAdminProducts());
    }, [mutationKey, mutationMsg, dispatch]);

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
            price: prod.price ?? "",
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

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        try {
            const compressedList = await Promise.all(files.map((file) => compressImage(file)));
            const valid = compressedList.filter(Boolean);

            setImages((prev) => [...prev, ...valid]);
            setImagePreviews((prev) => [...prev, ...valid]);
        } catch {
            toast.error("Failed to process one or more photographs.");
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        if (images.length <= 1) {
            toast.warn("A timepiece must have at least one photograph.");
            return;
        }
        setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        toast.info("Photograph removed.");
    };

    const handleSetCover = (index) => {
        if (index === 0) return;
        const targetImg = images[index];
        const targetPreview = imagePreviews[index];

        const otherImgs = images.filter((_, idx) => idx !== index);
        const otherPreviews = imagePreviews.filter((_, idx) => idx !== index);

        setImages([targetImg, ...otherImgs]);
        setImagePreviews([targetPreview, ...otherPreviews]);
        toast.info("Cover photograph updated.");
    };

    const handleMoveImage = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= images.length) return;
        const newImgs = [...images];
        const newPreviews = [...imagePreviews];

        const [movedImg] = newImgs.splice(fromIndex, 1);
        const [movedPreview] = newPreviews.splice(fromIndex, 1);

        newImgs.splice(toIndex, 0, movedImg);
        newPreviews.splice(toIndex, 0, movedPreview);

        setImages(newImgs);
        setImagePreviews(newPreviews);
    };

    const handleReplaceImage = async (index, file) => {
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            if (!compressed) return;

            setImages((prev) => {
                const copy = [...prev];
                copy[index] = compressed;
                return copy;
            });
            setImagePreviews((prev) => {
                const copy = [...prev];
                copy[index] = compressed;
                return copy;
            });
            toast.success(`Photograph ${index + 1} updated.`);
        } catch {
            toast.error("Failed to replace photograph.");
        }
    };

    const onSubmit = (values) => {
        if (!images.length) {
            toast.error("Please add at least one photograph for the timepiece.");
            return;
        }

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
                message: `"${prod.name}" will be deactivated and hidden from the public catalog. You can find and restore it anytime under the "Archived / Inactive" tab.`,
                confirmText: "Archive Timepiece"
            });

            if (confirmed) {
                dispatch(updateProduct(prod._id, { isActive: false }));
            }
        } else {
            const confirmed = await confirmAction({
                title: "Restore this timepiece?",
                message: `"${prod.name}" will be reactivated and visible in the public catalog again.`,
                confirmText: "Restore Timepiece",
                danger: false
            });

            if (confirmed) {
                dispatch(updateProduct(prod._id, { isActive: true }));
            }
        }
    };

    const handlePermanentDelete = async (prod) => {
        const confirmed = await confirmAction({
            title: "Delete permanently?",
            message: `"${prod.name}" will be permanently erased from the database. This action cannot be reversed.`,
            confirmText: "Delete Permanently",
            danger: true
        });

        if (confirmed) {
            try {
                await api.delete(`/admin/product/${prod._id}/hard`);
                toast.success("Timepiece removed permanently");
                dispatch(getAdminProducts());
            } catch (requestError) {
                toast.error(requestError.response?.data?.message || "Failed to permanently delete timepiece");
            }
        }
    };

    // checkbox selection for the admin datatable.
    const isSelected = (id) => selectedIds.includes(id);

    const handleToggleSelect = (id) => {
        setSelectedIds((previous) =>
            previous.includes(id)
                ? previous.filter((selectedId) => selectedId !== id)
                : [...previous, id]
        );
    };

    const allProducts = products || [];
    const activeCount = allProducts.filter((p) => p.isActive).length;
    const archivedCount = allProducts.filter((p) => !p.isActive).length;

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder(field === "name" ? "asc" : "desc");
        }
    };

    const visibleProducts = allProducts
        .filter((prod) => {
            if (statusFilter === "active" && !prod.isActive) return false;
            if (statusFilter === "archived" && prod.isActive) return false;
            if (conditionFilter && prod.condition !== conditionFilter) return false;
            if (stockFilter === "in-stock" && (Number(prod.stock) || 0) <= 0) return false;
            if (stockFilter === "out-of-stock" && (Number(prod.stock) || 0) > 0) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesName = prod.name?.toLowerCase().includes(q);
                const matchesBrand = prod.brand?.toLowerCase().includes(q);
                return matchesName || matchesBrand;
            }

            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortField === "name") {
                comparison = (a.name || "").localeCompare(b.name || "");
            } else if (sortField === "price") {
                comparison = (Number(a.price) || 0) - (Number(b.price) || 0);
            } else if (sortField === "stock") {
                comparison = (Number(a.stock) || 0) - (Number(b.stock) || 0);
            } else if (sortField === "condition") {
                comparison = (a.condition || "").localeCompare(b.condition || "");
            } else {
                comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

    const handleSelectAll = () => {
        const visibleIds = visibleProducts.map((p) => p._id);
        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

        setSelectedIds(allSelected ? [] : visibleIds);
    };

    const handleBulkArchive = async () => {
        if (selectedIds.length === 0) return;
        const confirmed = await confirmAction({
            title: `Archive ${selectedIds.length} timepiece(s)?`,
            message: "Selected timepieces will be deactivated and hidden from the storefront.",
            confirmText: "Archive Selected"
        });

        if (confirmed) {
            dispatch(bulkUpdateProductStatus(selectedIds, false));
        }
    };

    const handleBulkRestore = async () => {
        if (selectedIds.length === 0) return;
        const confirmed = await confirmAction({
            title: `Restore ${selectedIds.length} timepiece(s)?`,
            message: "Selected timepieces will be restored to the active catalog.",
            confirmText: "Restore Selected",
            danger: false
        });

        if (confirmed) {
            dispatch(bulkUpdateProductStatus(selectedIds, true));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warn("Select at least one timepiece first.");
            return;
        }

        const confirmed = await confirmAction({
            title: `Permanently delete ${selectedIds.length} selected timepiece(s)?`,
            message:
                "Selected timepieces will be removed. Timepieces linked to existing orders will remain archived.",
            confirmText: "Delete selected",
            danger: true
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
            <AdminHeader />

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

                {/* Metric Summary Cards */}
                <div className="vault-metrics-grid" style={{ marginBottom: "2rem" }}>
                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Total References</span>
                            <div className="vault-metric-icon"><IconWatch /></div>
                        </div>
                        <div className="vault-metric-val">{allProducts.length}</div>
                        <span className="vault-metric-hint">Unique timepiece models cataloged</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Active Listings</span>
                            <div className="vault-metric-icon"><IconSparkle /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "#4ade80" }}>{activeCount}</div>
                        <span className="vault-metric-hint">Publicly available on storefront</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>In-Stock Physical Units</span>
                            <div className="vault-metric-icon"><IconBox /></div>
                        </div>
                        <div className="vault-metric-val">
                            {allProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)}
                        </div>
                        <span className="vault-metric-hint">Total quantity across all inventory</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Inventory Valuation</span>
                            <div className="vault-metric-icon"><IconWallet /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "var(--gold)" }}>
                            {formatPrice(allProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0))}
                        </div>
                        <span className="vault-metric-hint">Combined market value of stock</span>
                    </article>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    <div className="admin-status-tabs">
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "all" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("all")}
                        >
                            All Timepieces <span className="admin-tab-count">{allProducts.length}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "active" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("active")}
                        >
                            Active <span className="admin-tab-count">{activeCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "archived" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("archived")}
                            style={archivedCount > 0 ? { borderColor: "var(--gold)", color: "var(--gold)" } : {}}
                        >
                            Archived / Inactive <span className="admin-tab-count">{archivedCount}</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ width: "160px" }}>
                            <AureoSelect
                                aria-label="Filter by condition"
                                value={conditionFilter}
                                onChange={(e) => setConditionFilter(e.target.value)}
                                options={[
                                    { value: "", label: "All Conditions" },
                                    { value: "new", label: "New" },
                                    { value: "second-hand", label: "Second-hand" },
                                    { value: "vintage", label: "Vintage" }
                                ]}
                            />
                        </div>

                        <div style={{ width: "180px" }}>
                            <AureoSelect
                                aria-label="Filter by stock"
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                options={[
                                    { value: "", label: "All Stock Levels" },
                                    { value: "in-stock", label: "In Stock (> 0)" },
                                    { value: "out-of-stock", label: "Out of Stock (0)" }
                                ]}
                            />
                        </div>

                        <div style={{ width: "180px" }}>
                            <AureoSelect
                                aria-label="Sort inventory"
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split("-");
                                    setSortField(field);
                                    setSortOrder(order);
                                }}
                                options={[
                                    { value: "createdAt-desc", label: "Newest Added" },
                                    { value: "createdAt-asc", label: "Oldest Added" },
                                    { value: "price-desc", label: "Price: High to Low" },
                                    { value: "price-asc", label: "Price: Low to High" },
                                    { value: "stock-asc", label: "Stock: Low to High" },
                                    { value: "stock-desc", label: "Stock: High to Low" },
                                    { value: "name-asc", label: "Name: A to Z" },
                                    { value: "name-desc", label: "Name: Z to A" }
                                ]}
                            />
                        </div>

                        <input
                            type="text"
                            className="catalog-input"
                            placeholder="Search by model or brand..."
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

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span>
                            {selectedIds.length} timepiece(s) selected
                        </span>
                        <button
                            type="button"
                            className="admin-btn restore-btn"
                            onClick={handleBulkRestore}
                            disabled={mutationLoading}
                        >
                            Restore selected
                        </button>
                        <button
                            type="button"
                            className="admin-btn edit-btn"
                            onClick={handleBulkArchive}
                            disabled={mutationLoading}
                        >
                            Archive selected
                        </button>
                        <button
                            type="button"
                            className="admin-btn del-btn"
                            onClick={handleBulkDelete}
                            disabled={mutationLoading}
                        >
                            Delete selected
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
                                    <AureoCheckbox
                                        inputProps={{ "aria-label": "Select all timepieces" }}
                                        checked={
                                            visibleProducts.length > 0 &&
                                            visibleProducts.every((p) => selectedIds.includes(p._id))
                                        }
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Photo</th>
                                <th
                                    className={`sortable-th ${sortField === "name" ? "is-sorted" : ""}`}
                                    onClick={() => handleSort("name")}
                                    title="Click to sort by Name"
                                >
                                    Name & Brand
                                    <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                </th>
                                <th>Movement</th>
                                <th
                                    className={`sortable-th ${sortField === "condition" ? "is-sorted" : ""}`}
                                    onClick={() => handleSort("condition")}
                                    title="Click to sort by Condition"
                                >
                                    Condition
                                    <span className="sort-icon">{sortField === "condition" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                </th>
                                <th
                                    className={`sortable-th ${sortField === "price" ? "is-sorted" : ""}`}
                                    onClick={() => handleSort("price")}
                                    title="Click to sort by Price"
                                >
                                    Price
                                    <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                </th>
                                <th
                                    className={`sortable-th ${sortField === "stock" ? "is-sorted" : ""}`}
                                    onClick={() => handleSort("stock")}
                                    title="Click to sort by Stock"
                                >
                                    Stock
                                    <span className="sort-icon">{sortField === "stock" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                </th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                                        {statusFilter === "archived" ? (
                                            <div>
                                                <p style={{ fontSize: "1.1rem", color: "var(--ivory)", margin: "0 0 0.4rem" }}>
                                                    No archived timepieces
                                                </p>
                                                <p style={{ fontSize: "0.85rem", margin: 0 }}>
                                                    When you deactivate a timepiece, it is safely stored here where you can restore it anytime.
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p style={{ fontSize: "1.1rem", color: "var(--ivory)", margin: "0 0 0.4rem" }}>
                                                    No timepieces found
                                                </p>
                                                <p style={{ fontSize: "0.85rem", margin: 0 }}>
                                                    Try clearing your search query or switching tabs.
                                                </p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                visibleProducts.map((prod) => (
                                    <tr key={prod._id} className={isSelected(prod._id) ? "admin-row-selected" : ""}>
                                        <td className="admin-select-cell">
                                            <AureoCheckbox
                                                inputProps={{ "aria-label": `Select ${prod.name}` }}
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
                                            <StatusBadge status={prod.condition} label={prod.condition} />
                                        </td>
                                        <td>{formatPrice(prod.price)}</td>
                                        <td>
                                            <strong>{prod.stock}</strong>
                                            {prod.condition === "second-hand" && <span className="single-unit-pill">Single unit</span>}
                                        </td>
                                        <td>
                                            <StatusBadge
                                                status={prod.isActive ? "active" : "archived"}
                                                label={prod.isActive ? "Active" : "Archived"}
                                            />
                                        </td>
                                        <td>
                                            <div className="admin-action-cell">
                                                {prod.isActive ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="admin-btn edit-btn"
                                                            onClick={() => handleOpenEdit(prod)}
                                                            style={PRODUCT_ACTION_STYLE}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="admin-btn del-btn"
                                                            onClick={() => handleToggleActive(prod)}
                                                            title="Archive / Deactivate this timepiece"
                                                            style={PRODUCT_DANGER_ACTION_STYLE}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="admin-btn restore-btn"
                                                            onClick={() => handleToggleActive(prod)}
                                                            title="Restore to active catalog"
                                                            style={PRODUCT_ACTION_STYLE}
                                                        >
                                                            Restore
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="admin-btn edit-btn"
                                                            onClick={() => handleOpenEdit(prod)}
                                                            style={PRODUCT_ACTION_STYLE}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="admin-btn del-btn"
                                                            onClick={() => handlePermanentDelete(prod)}
                                                            title="Permanently remove from database"
                                                            style={{
                                                                ...PRODUCT_ACTION_STYLE,
                                                                border: "1px solid #e53935",
                                                                background: "#e53935",
                                                                color: "#fff",
                                                                whiteSpace: "nowrap"
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <ModalPortal>
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
                                        placeholder="e.g. 2500000"
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

                                {/* Product Photos Manager with Edit / Delete / Cover / Reorder */}
                                <div className="product-photos-manager">
                                    <div className="product-photos-manager-head">
                                        <label className="admin-form-label" style={{ margin: 0, fontWeight: 600 }}>
                                            Timepiece Photographs ({imagePreviews.length})
                                        </label>
                                        <span className="product-photos-hint">
                                            The 1st photo is the primary showcase cover. Hover to manage.
                                        </span>
                                    </div>

                                    <div className="product-photos-grid">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className={`product-photo-card ${i === 0 ? "is-cover" : ""}`}>
                                                <div className="product-photo-preview">
                                                    <img src={src} alt={`Photograph ${i + 1}`} />
                                                    {i === 0 && (
                                                        <span className="product-photo-cover-tag">Cover</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="photo-delete-badge-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveImage(i);
                                                        }}
                                                        title="Delete this photograph"
                                                        aria-label="Delete photograph"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>

                                                <div className="product-photo-controls">
                                                    {i !== 0 ? (
                                                        <button
                                                            type="button"
                                                            className="photo-action-btn photo-cover-btn"
                                                            onClick={() => handleSetCover(i)}
                                                            title="Set as primary cover"
                                                        >
                                                            ★ Cover
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: "0.65rem", color: "var(--gold)", fontWeight: 600 }}>
                                                            Showcase
                                                        </span>
                                                    )}

                                                    <label className="photo-action-btn photo-replace-btn" title="Replace with another file">
                                                        <span>Replace</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: "none" }}
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    handleReplaceImage(i, e.target.files[0]);
                                                                    e.target.value = "";
                                                                }
                                                            }}
                                                        />
                                                    </label>

                                                    <div className="photo-reorder-group">
                                                        <button
                                                            type="button"
                                                            className="photo-action-btn"
                                                            disabled={i === 0}
                                                            onClick={() => handleMoveImage(i, i - 1)}
                                                            title="Move left"
                                                        >
                                                            ‹
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="photo-action-btn"
                                                            disabled={i === imagePreviews.length - 1}
                                                            onClick={() => handleMoveImage(i, i + 1)}
                                                            title="Move right"
                                                        >
                                                            ›
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <label className="product-photo-add-card" title="Upload more photos">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                style={{ display: "none" }}
                                            />
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            <span>+ Add Photos</span>
                                        </label>
                                    </div>
                                </div>

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
                </ModalPortal>
            )}
        </main>
    );
}

export default AdminProductsPage;
