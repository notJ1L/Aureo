import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { updateProfile, uploadAvatar, logoutUser, clearAuthError } from "../redux/actions/authActions";
import { ValidatedField } from "../components/ui/ValidatedField";
import { profileSchema } from "../utils/validationSchemas";
import { showError } from "../utils/sweetAlert";

function ProfilePage() {
    const dispatch = useDispatch();
    const { user, updateLoading, error } = useSelector((state) => state.auth);

    const [savedMsg, setSavedMsg] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(profileSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            contactNumber: "",
            addressLine: "",
            city: "",
            postalCode: "",
            country: ""
        }
    });

    // The form mirrors the loaded profile. It is reset whenever a different
    // profile arrives.
    useEffect(() => {
        if (!user) {
            return;
        }

        reset({
            name: user.name || "",
            contactNumber: user.contactNumber || "",
            addressLine: user.address?.addressLine || "",
            city: user.address?.city || "",
            postalCode: user.address?.postalCode || "",
            country: user.address?.country || ""
        });
    }, [user, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const onProfileSubmit = (values) => {
        setSavedMsg("");
        dispatch(
            updateProfile({
                name: values.name,
                contactNumber: values.contactNumber,
                address: {
                    addressLine: values.addressLine,
                    city: values.city,
                    postalCode: values.postalCode,
                    country: values.country
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
            showError("File size exceeds 2MB limit.");
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

                    <form onSubmit={handleSubmit(onProfileSubmit)} className="profile-form" noValidate>
                        <h3>Personal Details</h3>

                        <ValidatedField
                            control={control}
                            name="name"
                            label="Full Name"
                            autoComplete="name"
                            error={errors.name?.message}
                        />

                        <label>
                            Email (Cannot be changed)
                            <input
                                value={user?.email || ""}
                                disabled
                                style={{ opacity: 0.6 }}
                            />
                        </label>

                        <ValidatedField
                            control={control}
                            name="contactNumber"
                            label="Contact Number"
                            placeholder="+63 900 000 0000"
                            hint="Optional. Used for delivery updates."
                            error={errors.contactNumber?.message}
                        />

                        <h3>Delivery Address</h3>

                        <ValidatedField
                            control={control}
                            name="addressLine"
                            label="Street Address"
                            placeholder="Unit 4B, Emerald Tower, Ayala Ave"
                            error={errors.addressLine?.message}
                        />

                        <div className="form-row-3">
                            <ValidatedField
                                control={control}
                                name="city"
                                label="City"
                                placeholder="Makati"
                                error={errors.city?.message}
                            />

                            <ValidatedField
                                control={control}
                                name="postalCode"
                                label="Postal Code"
                                placeholder="1226"
                                error={errors.postalCode?.message}
                            />

                            <ValidatedField
                                control={control}
                                name="country"
                                label="Country"
                                placeholder="Philippines"
                                error={errors.country?.message}
                            />
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
