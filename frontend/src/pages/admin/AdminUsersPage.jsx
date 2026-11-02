import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import {
    getAdminUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    clearErrors
} from "../../redux/actions/userActions";
import {
    USER_CREATE_RESET,
    USER_UPDATE_RESET,
    USER_DELETE_RESET,
    USER_BULK_DELETE_RESET
} from "../../redux/constants/userConstants";
import { adminUserSchema } from "../../utils/validationSchemas";
import { confirmAction } from "../../utils/sweetAlert";
import api from "../../services/api";
import AdminHeader from "../../components/layout/AdminHeader";
import { AureoCheckbox, AureoSelect } from "../../components/ui";
import {
    IconUser,
    IconBag,
    IconShield,
    IconSparkle
} from "../../components/layout/icons";

const EMPTY_FORM = {
    name: "",
    email: "",
    role: "user",
    contactNumber: "",
    address: "",
    isVerified: true,
    password: ""
};

const USER_ACTION_STYLE = {
    height: "32px",
    padding: "4px 12px",
    border: "1px solid var(--gold)",
    borderRadius: "4px",
    background: "transparent",
    color: "var(--gold)",
    fontSize: "0.8rem",
    whiteSpace: "nowrap"
};

const USER_DANGER_ACTION_STYLE = {
    ...USER_ACTION_STYLE,
    borderColor: "#e53935",
    color: "#e53935"
};

export default function AdminUsersPage() {
    const dispatch = useDispatch();

    const { user: currentUser } = useSelector((state) => state.auth);
    const { users, loading, error } = useSelector((state) => state.adminUsers);
    const {
        loading: mutationLoading,
        success,
        isUpdated,
        isDeleted,
        isBulkDeleted,
        error: mutationError
    } = useSelector((state) => state.userMutation);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [sortField, setSortField] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(adminUserSchema),
        mode: "onBlur",
        defaultValues: EMPTY_FORM
    });

    const isVerifiedWatch = watch("isVerified");

    useEffect(() => {
        dispatch(getAdminUsers());
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
            setEditingUser(null);
        }

        if (mutationKey === "bulk") {
            setSelectedIds([]);
        }
    } else if (!mutationKey && handledMutation) {
        setHandledMutation(null);
    }

    useEffect(() => {
        if (!mutationKey) return;

        if (mutationKey === "create") {
            toast.success("User account created successfully");
            dispatch({ type: USER_CREATE_RESET });
        } else if (mutationKey === "update") {
            toast.success("User account updated successfully");
            dispatch({ type: USER_UPDATE_RESET });
        } else if (mutationKey === "delete") {
            toast.success("User deleted successfully");
            dispatch({ type: USER_DELETE_RESET });
        } else if (mutationKey === "bulk") {
            toast.success("Selected users deleted successfully");
            dispatch({ type: USER_BULK_DELETE_RESET });
        }

        dispatch(getAdminUsers());
    }, [mutationKey, dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearErrors());
        }
        if (mutationError) {
            toast.error(mutationError);
            dispatch(clearErrors());
        }
    }, [error, mutationError, dispatch]);

    // Summary counts
    // Summary counts
    const counts = useMemo(() => {
        const list = users || [];
        return {
            total: list.length,
            active: list.filter((u) => u.isActive !== false).length,
            archived: list.filter((u) => u.isActive === false).length,
            clients: list.filter((u) => u.role === "user").length,
            admins: list.filter((u) => u.role === "admin").length,
            verified: list.filter((u) => u.isVerified).length,
            unverified: list.filter((u) => !u.isVerified).length
        };
    }, [users]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder(field === "name" ? "asc" : "desc");
        }
    };

    // Filter & search & sort
    const filteredUsers = useMemo(() => {
        let list = [...(users || [])];

        if (activeTab === "active") {
            list = list.filter((u) => u.isActive !== false);
        } else if (activeTab === "archived") {
            list = list.filter((u) => u.isActive === false);
        } else if (activeTab === "clients") {
            list = list.filter((u) => u.role === "user");
        } else if (activeTab === "admins") {
            list = list.filter((u) => u.role === "admin");
        } else if (activeTab === "verified") {
            list = list.filter((u) => u.isVerified);
        } else if (activeTab === "unverified") {
            list = list.filter((u) => !u.isVerified);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.contactNumber?.toLowerCase().includes(q) ||
                    u.address?.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            let comp = 0;
            if (sortField === "role") {
                comp = (a.role || "").localeCompare(b.role || "");
            } else if (sortField === "joined") {
                comp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            } else {
                comp = (a.name || "").localeCompare(b.name || "");
            }
            return sortOrder === "asc" ? comp : -comp;
        });

        return list;
    }, [users, activeTab, searchQuery, sortField, sortOrder]);

    const handleOpenCreate = () => {
        setEditingUser(null);
        reset(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (targetUser) => {
        setEditingUser(targetUser);
        reset({
            name: targetUser.name || "",
            email: targetUser.email || "",
            role: targetUser.role || "user",
            contactNumber: targetUser.contactNumber || "",
            address: targetUser.address || "",
            isVerified: Boolean(targetUser.isVerified),
            password: ""
        });
        setIsModalOpen(true);
    };

    const onSubmit = (formData) => {
        const payload = { ...formData };
        if (!payload.password) {
            delete payload.password;
        }

        if (editingUser) {
            dispatch(updateUser(editingUser._id, payload));
        } else {
            dispatch(createUser(payload));
        }
    };

    const handleToggleActive = async (targetUser) => {
        if (targetUser._id === currentUser?._id) {
            toast.warn("You cannot deactivate your own administrator account.");
            return;
        }

        const isCurrentlyActive = targetUser.isActive !== false;

        if (isCurrentlyActive) {
            const confirmed = await confirmAction({
                title: `Deactivate user "${targetUser.name}"?`,
                message: `This will archive the account (${targetUser.email}). The user will not be able to log in, but all transaction history is safely preserved. You can restore it anytime.`,
                confirmText: "Deactivate Account",
                danger: true
            });

            if (confirmed) {
                dispatch(deleteUser(targetUser._id));
            }
        } else {
            const confirmed = await confirmAction({
                title: `Restore user "${targetUser.name}"?`,
                message: `This will reactivate the account (${targetUser.email}) and restore normal login and purchasing access.`,
                confirmText: "Restore Account",
                danger: false
            });

            if (confirmed) {
                dispatch(updateUser(targetUser._id, { isActive: true }));
            }
        }
    };

    const handlePermanentDelete = async (targetUser) => {
        const confirmed = await confirmAction({
            title: "Permanently Delete?",
            message: "This will permanently delete this user. This cannot be undone.",
            confirmText: "Delete Permanently",
            danger: true
        });

        if (!confirmed) return;

        try {
            await api.delete(`/admin/user/${targetUser._id}/hard`);
            toast.success("User deleted permanently");
            dispatch(getAdminUsers());
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || "Failed to permanently delete user");
        }
    };

    const handleToggleRole = async (targetUser) => {
        if (targetUser._id === currentUser?._id) {
            toast.warn("You cannot alter your own administrator role.");
            return;
        }

        const newRole = targetUser.role === "admin" ? "user" : "admin";
        const roleLabel = newRole === "admin" ? "Administrator" : "Client";

        const confirmed = await confirmAction({
            title: `Change role to ${roleLabel}?`,
            message: `Update permissions for "${targetUser.name}" (${targetUser.email}) to ${roleLabel}.`,
            confirmText: `Promote / Demote to ${roleLabel}`,
            danger: newRole === "user"
        });

        if (confirmed) {
            dispatch(updateUser(targetUser._id, { role: newRole }));
        }
    };

    const isSelected = (id) => selectedIds.includes(id);

    const handleToggleSelect = (id) => {
        if (id === currentUser?._id) return; // Prevent self-select for bulk deletion
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const selectable = filteredUsers
            .filter((u) => u._id !== currentUser?._id)
            .map((u) => u._id);

        const allSelected = selectable.length > 0 && selectable.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : selectable);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warn("Select at least one user first.");
            return;
        }

        const confirmed = await confirmAction({
            title: `Delete ${selectedIds.length} selected user(s)?`,
            message: "All selected accounts will be permanently removed. This action cannot be undone.",
            confirmText: "Delete Accounts",
            danger: true
        });

        if (confirmed) {
            dispatch(bulkDeleteUsers(selectedIds));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    return (
        <main className="admin-page page-enter">
            <AdminHeader />

            <div className="admin-container admin-container--wide">
                {/* Title & Action Bar */}
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">ACCESS & PRIVILEGES</p>
                        <h1>User Directory</h1>
                    </div>
                    <button type="button" className="gold-button" onClick={handleOpenCreate}>
                        + Add User
                    </button>
                </div>

                {/* Metric Summary Cards */}
                <div className="vault-metrics-grid" style={{ marginBottom: "2rem" }}>
                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Total Registered</span>
                            <div className="vault-metric-icon"><IconUser /></div>
                        </div>
                        <div className="vault-metric-val">{counts.total}</div>
                        <span className="vault-metric-hint">All authenticated accounts</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Client Accounts</span>
                            <div className="vault-metric-icon"><IconBag /></div>
                        </div>
                        <div className="vault-metric-val">{counts.clients}</div>
                        <span className="vault-metric-hint">Standard purchasing collectors</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Administrators</span>
                            <div className="vault-metric-icon"><IconShield /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "var(--gold)" }}>{counts.admins}</div>
                        <span className="vault-metric-hint">Full vault HQ management access</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Verified Accounts</span>
                            <div className="vault-metric-icon"><IconSparkle /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "#4ade80" }}>{counts.verified}</div>
                        <span className="vault-metric-hint">Email & security confirmed</span>
                    </article>
                </div>

                {/* Filter Tabs & Search Row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1.5rem"
                    }}
                >
                    <div className="admin-status-tabs" style={{ marginBottom: 0 }}>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All Users <span className="admin-tab-count">{counts.total}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "active" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("active")}
                        >
                            Active <span className="admin-tab-count">{counts.active}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "clients" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("clients")}
                        >
                            Clients <span className="admin-tab-count">{counts.clients}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "admins" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("admins")}
                        >
                            Admins <span className="admin-tab-count">{counts.admins}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "verified" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("verified")}
                        >
                            Verified <span className="admin-tab-count">{counts.verified}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${activeTab === "archived" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("archived")}
                        >
                            Archived <span className="admin-tab-count">{counts.archived}</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ width: "190px" }}>
                            <AureoSelect
                                aria-label="Sort users"
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split("-");
                                    setSortField(field);
                                    setSortOrder(order);
                                }}
                                options={[
                                    { value: "name-asc", label: "Name: A to Z" },
                                    { value: "name-desc", label: "Name: Z to A" },
                                    { value: "joined-desc", label: "Joined: Newest First" },
                                    { value: "joined-asc", label: "Joined: Oldest First" },
                                    { value: "role-desc", label: "Role: Admins First" },
                                    { value: "role-asc", label: "Role: Clients First" }
                                ]}
                            />
                        </div>

                        <div style={{ position: "relative", minWidth: "240px" }}>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.5rem 1rem",
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "6px",
                                    color: "var(--ivory)",
                                    fontSize: "0.82rem"
                                }}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    style={{
                                        position: "absolute",
                                        right: "0.8rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        cursor: "pointer"
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar" style={{ marginBottom: "1rem" }}>
                        <span>{selectedIds.length} user(s) selected</span>
                        <button type="button" className="admin-btn del-btn" onClick={handleBulkDelete}>
                            Delete Selected
                        </button>
                    </div>
                )}

                {/* Users Table */}
                {loading ? (
                    <div
                        style={{
                            height: "300px",
                            borderRadius: "8px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            animation: "aureoPulseGold 2s infinite"
                        }}
                    />
                ) : filteredUsers.length === 0 ? (
                    <div
                        style={{
                            padding: "4rem 2rem",
                            textAlign: "center",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px"
                        }}
                    >
                        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                            {searchQuery ? "No users matching your search." : "No users found in this filter."}
                        </p>
                        {searchQuery && (
                            <button
                                type="button"
                                className="admin-btn edit-btn"
                                onClick={() => setSearchQuery("")}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table admin-table--users">
                            <thead>
                                <tr>
                                    <th style={{ width: "40px" }}>
                                        <AureoCheckbox
                                            checked={
                                                filteredUsers.filter((u) => u._id !== currentUser?._id).length > 0 &&
                                                filteredUsers
                                                    .filter((u) => u._id !== currentUser?._id)
                                                    .every((u) => selectedIds.includes(u._id))
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th
                                        className={`sortable-th ${sortField === "name" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("name")}
                                        title="Click to sort by Name"
                                    >
                                        User
                                        <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th>Email & Contact</th>
                                    <th
                                        className={`sortable-th ${sortField === "role" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("role")}
                                        title="Click to sort by Role"
                                    >
                                        Role
                                        <span className="sort-icon">{sortField === "role" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th>Status</th>
                                    <th>Provider</th>
                                    <th
                                        className={`sortable-th ${sortField === "joined" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("joined")}
                                        title="Click to sort by Date Joined"
                                    >
                                        Joined
                                        <span className="sort-icon">{sortField === "joined" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((targetUser) => {
                                    const isSelf = targetUser._id === currentUser?._id;
                                    const isAdmin = targetUser.role === "admin";

                                    return (
                                        <tr key={targetUser._id}>
                                            <td>
                                                <AureoCheckbox
                                                    checked={isSelected(targetUser._id)}
                                                    onChange={() => handleToggleSelect(targetUser._id)}
                                                    disabled={isSelf}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                                    {targetUser.avatar?.url ? (
                                                        <img
                                                            src={targetUser.avatar.url}
                                                            alt={targetUser.name}
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                borderRadius: "50%",
                                                                objectFit: "cover",
                                                                border: "1px solid var(--border-gold)"
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                borderRadius: "50%",
                                                                background: isAdmin ? "var(--gold-dim)" : "var(--bg-elevated)",
                                                                color: isAdmin ? "var(--gold)" : "var(--ivory)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontWeight: 600,
                                                                fontSize: "0.85rem",
                                                                border: isAdmin ? "1px solid var(--gold)" : "1px solid var(--border)"
                                                            }}
                                                        >
                                                            {targetUser.name?.[0]?.toUpperCase() || "U"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "var(--ivory)" }}>
                                                            {targetUser.name}
                                                            {isSelf && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: "0.5rem",
                                                                        fontSize: "0.7rem",
                                                                        padding: "0.15rem 0.4rem",
                                                                        borderRadius: "4px",
                                                                        background: "var(--gold-dim)",
                                                                        color: "var(--gold)"
                                                                    }}
                                                                >
                                                                    YOU
                                                                </span>
                                                            )}
                                                        </div>
                                                        {targetUser.address && (
                                                            <div
                                                                style={{
                                                                    fontSize: "0.75rem",
                                                                    color: "var(--text-muted)",
                                                                    maxWidth: "200px",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis"
                                                                }}
                                                            >
                                                                {targetUser.address}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ color: "var(--ivory)", fontSize: "0.85rem" }}>
                                                    {targetUser.email}
                                                </div>
                                                {targetUser.contactNumber && (
                                                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                                        {targetUser.contactNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "0.25rem 0.65rem",
                                                        borderRadius: "4px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        letterSpacing: "0.05em",
                                                        textTransform: "uppercase",
                                                        background: isAdmin ? "rgba(212, 175, 55, 0.15)" : "rgba(255, 255, 255, 0.06)",
                                                        color: isAdmin ? "var(--gold)" : "var(--text-muted)",
                                                        border: isAdmin ? "1px solid rgba(212, 175, 55, 0.4)" : "1px solid var(--border)"
                                                    }}
                                                >
                                                    {isAdmin ? "Admin" : "Client"}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "0.2rem 0.55rem",
                                                            borderRadius: "4px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 500,
                                                            background: targetUser.isVerified
                                                                ? "rgba(34, 197, 94, 0.15)"
                                                                : "rgba(245, 158, 11, 0.15)",
                                                            color: targetUser.isVerified
                                                                ? "#4ade80"
                                                                : "#fbbf24",
                                                            border: targetUser.isVerified
                                                                ? "1px solid rgba(34, 197, 94, 0.3)"
                                                                : "1px solid rgba(245, 158, 11, 0.3)"
                                                        }}
                                                    >
                                                        {targetUser.isVerified ? "Verified" : "Pending"}
                                                    </span>
                                                    {targetUser.isActive === false && (
                                                        <span
                                                            style={{
                                                                display: "inline-block",
                                                                padding: "0.15rem 0.45rem",
                                                                borderRadius: "4px",
                                                                fontSize: "0.68rem",
                                                                fontWeight: 600,
                                                                letterSpacing: "0.04em",
                                                                background: "rgba(239, 68, 68, 0.15)",
                                                                color: "#f87171",
                                                                border: "1px solid rgba(239, 68, 68, 0.3)"
                                                            }}
                                                        >
                                                            ARCHIVED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textTransform: "capitalize", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                                {targetUser.authSource || "local"}
                                            </td>
                                            <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                                {formatDate(targetUser.createdAt)}
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                                                    <button
                                                        type="button"
                                                        className="admin-btn edit-btn"
                                                        onClick={() => handleOpenEdit(targetUser)}
                                                        title="Edit User Details"
                                                        style={USER_ACTION_STYLE}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-btn"
                                                        onClick={() => handleToggleRole(targetUser)}
                                                        disabled={isSelf}
                                                        title={isAdmin ? "Demote to Client" : "Promote to Admin"}
                                                        style={USER_ACTION_STYLE}
                                                    >
                                                        {isAdmin ? "Demote" : "Promote"}
                                                    </button>
                                                    {targetUser.isActive === false ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="admin-btn"
                                                                onClick={() => handlePermanentDelete(targetUser)}
                                                                title="Permanently delete this user"
                                                                style={{
                                                                    ...USER_ACTION_STYLE,
                                                                    border: "1px solid #e53935",
                                                                    background: "#e53935",
                                                                    color: "#fff",
                                                                    whiteSpace: "nowrap"
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="admin-btn restore-btn"
                                                                onClick={() => handleToggleActive(targetUser)}
                                                                title="Restore this user account"
                                                                style={USER_ACTION_STYLE}
                                                            >
                                                                Reactivate
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="admin-btn del-btn"
                                                            onClick={() => handleToggleActive(targetUser)}
                                                            disabled={isSelf}
                                                            title={isSelf ? "You cannot deactivate your own account" : "Deactivate (Soft Delete) User"}
                                                            style={USER_DANGER_ACTION_STYLE}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit User Modal */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="modal-card"
                        style={{ maxWidth: "560px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head">
                            <div>
                                <p className="eyebrow" style={{ margin: 0 }}>
                                    {editingUser ? "MODIFY ACCOUNT" : "NEW REGISTRATION"}
                                </p>
                                <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "1.4rem", margin: "0.2rem 0 0" }}>
                                    {editingUser ? "Edit User Account" : "Create New User"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="admin-form" style={{ marginTop: "1.5rem" }}>
                            {/* Full Name */}
                            <div className="admin-field">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Eleanor Vance"
                                    {...register("name")}
                                />
                                {errors.name && <span className="auth-field-error">{errors.name.message}</span>}
                            </div>

                            {/* Email */}
                            <div className="admin-field">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="client@aureo.com"
                                    {...register("email")}
                                />
                                {errors.email && <span className="auth-field-error">{errors.email.message}</span>}
                            </div>

                            {/* Two-column: Role & Status */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="admin-field">
                                    <label>Role</label>
                                    <AureoSelect
                                        value={watch("role") || "user"}
                                        onChange={(e) => setValue("role", e.target.value, { shouldValidate: true })}
                                        options={[
                                            { value: "user", label: "Client" },
                                            { value: "admin", label: "Administrator" }
                                        ]}
                                    />
                                    {errors.role && <span className="auth-field-error">{errors.role.message}</span>}
                                </div>

                                <div className="admin-field">
                                    <label>Account Status</label>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.6rem",
                                            padding: "0.6rem 0.8rem",
                                            background: "var(--bg-elevated)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "6px",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => setValue("isVerified", !isVerifiedWatch)}
                                    >
                                        <AureoCheckbox
                                            checked={isVerifiedWatch}
                                            onChange={(e) => setValue("isVerified", e.target.checked)}
                                        />
                                        <span style={{ fontSize: "0.85rem", color: "var(--ivory)" }}>
                                            {isVerifiedWatch ? "Verified (Active)" : "Pending Verification"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div className="admin-field">
                                <label>Contact Number (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="+63 912 345 6789"
                                    {...register("contactNumber")}
                                />
                                {errors.contactNumber && (
                                    <span className="auth-field-error">{errors.contactNumber.message}</span>
                                )}
                            </div>

                            {/* Address */}
                            <div className="admin-field">
                                <label>Delivery / Billing Address (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Unit 12B, Luxury Tower, Makati City"
                                    {...register("address")}
                                />
                                {errors.address && (
                                    <span className="auth-field-error">{errors.address.message}</span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="admin-field">
                                <label>
                                    {editingUser ? "Reset Password (Leave blank to keep current)" : "Password"}
                                </label>
                                <input
                                    type="password"
                                    placeholder={editingUser ? "••••••••" : "Default: AureoPass123!"}
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <span className="auth-field-error">{errors.password.message}</span>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "0.8rem",
                                    marginTop: "1.5rem"
                                }}
                            >
                                <button
                                    type="button"
                                    className="admin-btn"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={mutationLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="gold-button"
                                    disabled={mutationLoading}
                                >
                                    {mutationLoading
                                        ? "Saving..."
                                        : editingUser
                                          ? "Save Changes"
                                          : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
