import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, uploadAvatar, logoutUser, clearAuthError } from "../redux/actions/authActions";

function ProfilePage() {
    const dispatch = useDispatch();
    const { user, updateLoading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        name: "",
        contactNumber: "",
        addressLine: "",
        city: "",
        postalCode: "",
        country: ""
    });

    const [savedMsg, setSavedMsg] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                contactNumber: user.contactNumber || "",
                addressLine: user.address?.addressLine || "",
                city: user.address?.city || "",
                postalCode: user.address?.postalCode || "",
                country: user.address?.country || ""
            });
        }
    }, [user]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        setSavedMsg("");
        dispatch(
            updateProfile({
                name: form.name,
                contactNumber: form.contactNumber,
                address: {
                    addressLine: form.addressLine,
                    city: form.city,
                    postalCode: form.postalCode,
                    country: form.country
                }
            })
        );
        setSavedMsg("Profile updated successfully.");
        setTimeout(() => setSavedMsg(""), 3000);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File size exceeds 2MB limit.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result);
                dispatch(uploadAvatar(reader.result));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <main className="profile-page">
            <header className="profile-header-bar">
                <Link to="/" className="auth-back">
                    ← Back to store
                </Link>
                <button type="button" className="outline-button" onClick={handleLogout}>
                    Sign out
                </button>
            </header>

            <div className="profile-container">
                <section className="profile-card">
                    <div className="profile-top">
                        <div className="avatar-wrapper">
                            <img
                                src={avatarPreview || user?.avatar?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                                alt={user?.name || "User Avatar"}
                                className="profile-avatar"
                            />
                            <label className="avatar-upload-btn">
                                <span>Change Photo</span>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={handleAvatarChange}
                                    style={{ display: "none" }}
                                />
                            </label>
                        </div>

                        <div className="profile-meta">
                            <p className="eyebrow">AUREO MEMBER</p>
                            <h2>{user?.name}</h2>
                            <p className="profile-email">{user?.email}</p>
                            <div className="profile-badges">
                                <span className="badge role-badge">{user?.role?.toUpperCase()}</span>
                                <span className={`badge ${user?.isVerified ? "verified-badge" : "unverified-badge"}`}>
                                    {user?.isVerified ? "✓ Verified" : "⚠ Unverified"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}
                    {savedMsg && <div className="auth-info">{savedMsg}</div>}

                    <hr className="profile-divider" />

                    <form onSubmit={handleProfileSubmit} className="profile-form">
                        <h3>Personal Details</h3>

                        <label>
                            Full Name
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label>
                            Email (Cannot be changed)
                            <input
                                value={user?.email || ""}
                                disabled
                                style={{ opacity: 0.6 }}
                            />
                        </label>

                        <label>
                            Contact Number
                            <input
                                name="contactNumber"
                                value={form.contactNumber}
                                onChange={handleChange}
                                placeholder="+63 900 000 0000"
                            />
                        </label>

                        <h3>Delivery Address</h3>

                        <label>
                            Street Address
                            <input
                                name="addressLine"
                                value={form.addressLine}
                                onChange={handleChange}
                                placeholder="Unit 4B, Emerald Tower, Ayala Ave"
                            />
                        </label>

                        <div className="form-row-3">
                            <label>
                                City
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Makati"
                                />
                            </label>

                            <label>
                                Postal Code
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    placeholder="1226"
                                />
                            </label>

                            <label>
                                Country
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    placeholder="Philippines"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="gold-button"
                            disabled={updateLoading}
                            style={{ marginTop: "1rem" }}
                        >
                            {updateLoading ? "Saving..." : "Save Profile Details"}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default ProfilePage;
