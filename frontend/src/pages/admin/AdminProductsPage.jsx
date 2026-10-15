import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    clearProductErrors
} from "../../redux/actions/productActions";
import {
    PRODUCT_CREATE_RESET,
    PRODUCT_UPDATE_RESET,
    PRODUCT_DELETE_RESET
} from "../../redux/constants/productConstants";

function AdminProductsPage() {
    const dispatch = useDispatch();
    const { products, loading, error } = useSelector((state) => state.adminProducts);
    const { loading: mutationLoading, success, isUpdated, isDeleted, error: mutationError } = useSelector((state) => state.productMutation);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [form, setForm] = useState({
        name: "",
        brand: "",
        category: "luxury",
        movement: "automatic",
        caseSize: 40,
        condition: "new",
        price: 0,
        stock: 5,
        description: "",
        images: []
    });

    const [imagePreviews, setImagePreviews] = useState([]);

    useEffect(() => {
        dispatch(getAdminProducts());
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            alert("Product created successfully!");
            setIsModalOpen(false);
            resetForm();
            dispatch({ type: PRODUCT_CREATE_RESET });
            dispatch(getAdminProducts());
        }
        if (isUpdated) {
            alert("Product updated successfully!");
            setIsModalOpen(false);
            resetForm();
            dispatch({ type: PRODUCT_UPDATE_RESET });
            dispatch(getAdminProducts());
        }
        if (isDeleted) {
            alert("Product removed or deactivated!");
            dispatch({ type: PRODUCT_DELETE_RESET });
            dispatch(getAdminProducts());
        }
    }, [success, isUpdated, isDeleted, dispatch]);

    const resetForm = () => {
        setForm({
            name: "",
            brand: "",
            category: "luxury",
            movement: "automatic",
            caseSize: 40,
            condition: "new",
            price: 0,
            stock: 5,
            description: "",
            images: []
        });
        setImagePreviews([]);
        setEditingProduct(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        setForm({
            name: prod.name,
            brand: prod.brand,
            category: prod.category || "luxury",
            movement: prod.movement,
            caseSize: prod.caseSize,
            condition: prod.condition,
            price: prod.price,
            stock: prod.stock,
            description: prod.description,
            images: prod.images || []
        });
        setImagePreviews(prod.images?.map((i) => i.url) || []);
        setIsModalOpen(true);
    };

    const handleConditionChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({
            ...prev,
            condition: val,
            stock: val === "second-hand" ? 1 : prev.stock
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newImages = [...form.images];
        const newPreviews = [...imagePreviews];

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    newImages.push(reader.result);
                    newPreviews.push(reader.result);
                    setImagePreviews([...newPreviews]);
                    setForm((prev) => ({ ...prev, images: newImages }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Enforce FR 2.2: Second-hand stock must be 1 (or 0 if sold)
        if (form.condition === "second-hand" && !editingProduct && Number(form.stock) !== 1) {
            alert("Second-hand timepieces must have a stock of exactly 1.");
            return;
        }

        if (editingProduct) {
            dispatch(updateProduct(editingProduct._id, form));
        } else {
            dispatch(createProduct(form));
        }
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete or deactivate "${name}"?`)) {
            dispatch(deleteProduct(id));
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

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
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
                            {products?.map((prod) => (
                                <tr key={prod._id}>
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
                                                className="admin-btn del-btn"
                                                onClick={() => handleDelete(prod._id, prod.name)}
                                            >
                                                Remove
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

                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="form-row-2">
                                <label>
                                    Watch Name
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Submariner Date 41"
                                        required
                                    />
                                </label>
                                <label>
                                    Brand
                                    <input
                                        value={form.brand}
                                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                        placeholder="e.g. Rolex"
                                        required
                                    />
                                </label>
                            </div>

                            <div className="form-row-3">
                                <label>
                                    Movement
                                    <select
                                        value={form.movement}
                                        onChange={(e) => setForm({ ...form, movement: e.target.value })}
                                        className="catalog-select"
                                    >
                                        <option value="automatic">Automatic</option>
                                        <option value="manual">Manual</option>
                                        <option value="quartz">Quartz</option>
                                    </select>
                                </label>
                                <label>
                                    Case Size (mm)
                                    <input
                                        type="number"
                                        value={form.caseSize}
                                        onChange={(e) => setForm({ ...form, caseSize: Number(e.target.value) })}
                                        required
                                    />
                                </label>
                                <label>
                                    Condition
                                    <select
                                        value={form.condition}
                                        onChange={handleConditionChange}
                                        className="catalog-select"
                                    >
                                        <option value="new">Brand New</option>
                                        <option value="second-hand">Second-hand (Pre-owned)</option>
                                    </select>
                                </label>
                            </div>

                            <div className="form-row-2">
                                <label>
                                    Price (PHP)
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                        required
                                    />
                                </label>
                                <label>
                                    Stock
                                    <input
                                        type="number"
                                        value={form.stock}
                                        disabled={form.condition === "second-hand"}
                                        onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                                        required
                                    />
                                    {form.condition === "second-hand" && (
                                        <span className="field-hint">Locked to 1 for second-hand items (FR 2.2)</span>
                                    )}
                                </label>
                            </div>

                            <label>
                                Description & Provenance
                                <textarea
                                    rows={4}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Details on movement, archival history, box/papers..."
                                    required
                                />
                            </label>

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
