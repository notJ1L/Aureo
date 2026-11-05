import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { updateProfile, uploadAvatar, logoutUser, clearAuthError } from "../redux/actions/authActions";
import { ValidatedField } from "../components/ui/ValidatedField";
import { profileSchema } from "../utils/validationSchemas";
import { showError } from "../utils/sweetAlert";
import { showNotification } from "../utils/notification";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

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
        mode: "onTouched",
        defaultValues: {
            name: "",
            contactNumber: "",
            addressLine: "",
            city: "",
            postalCode: "",
            country: ""
        }
    });

    useEffect(() => {
        if (!user) {
            return;
        }

        let addressLine = "";
        let city = "";
        let postalCode = "";
        let country = "";

        if (user.address) {
            if (typeof user.address === "object") {
                addressLine = user.address.addressLine || "";
                city = user.address.city || "";
                postalCode = user.address.postalCode || "";
                country = user.address.country || "";
            } else if (typeof user.address === "string") {
                const trimmed = user.address.trim();
                const isOnlyPhilippines =
                    trimmed.toLowerCase() === "philippines" ||
                    /^philippines(\s*,\s*philippines)+$/i.test(trimmed);

                if (!isOnlyPhilippines && trimmed.length > 0) {
                    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
                    if (parts.length >= 4) {
                        addressLine = parts.slice(0, parts.length - 3).join(", ");
                        city = parts[parts.length - 3];
                        postalCode = parts[parts.length - 2];
                        country = parts[parts.length - 1];
                    } else if (parts.length === 3) {
                        addressLine = parts[0];
                        city = parts[1];
                        country = parts[2];
                    } else if (parts.length === 2) {
                        addressLine = parts[0];
                        city = parts[1];
                    } else if (parts.length === 1) {
                        addressLine = parts[0];
                    }
                }
            }
        }

        reset({
            name: user.name || "",
            contactNumber: user.contactNumber || "",
            addressLine: addressLine || "",
            city: city || "",
            postalCode: postalCode || "",
            country: country || ""
        });
    }, [user, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const onProfileSubmit = async (values) => {
        setSavedMsg("");
        dispatch(clearAuthError());
        const result = await dispatch(
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
        if (result?.success) {
            showNotification({
                type: "success",
                message: "Profile updated successfully."
            });
            setSavedMsg("Profile updated successfully.");
            setTimeout(() => setSavedMsg(""), 3000);
        }
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
                showNotification({
                    type: "success",
                    message: "Profile avatar updated."
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <main className="profile-page page-enter">
            <SiteHeader variant="solid" />

            <div className="profile-container">
                <section className="profile-hero">
                    <div className="avatar-wrapper">
                        <img
                            src={avatarPreview || user?.avatar?.url || "/default_avatar.png"}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/default_avatar.png"; }}
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
                                {user?.isVerified ? "✓ Verified" : "Unverified"}
                            </span>
                        </div>
                    </div>

                    <div className="profile-hero-actions">
                        <button type="button" className="outline-button" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </div>
                </section>

                {error && !savedMsg && <div className="auth-error">{error}</div>}
                {savedMsg && <div className="auth-info">{savedMsg}</div>}

                <form onSubmit={handleSubmit(onProfileSubmit)} className="profile-form" noValidate>
                    <section className="profile-section">
                        <p className="eyebrow">PERSONAL DETAILS</p>

                        <ValidatedField
                            control={control}
                            name="name"
                            label="Full Name"
                            autoComplete="name"
                            error={errors.name?.message}
                        />

                        <label>
                            Email Address
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                style={{ opacity: 0.65, cursor: "not-allowed" }}
                            />
                            <span className="field-hint">Email is bound to your authentication provider.</span>
                        </label>

                        <ValidatedField
                            control={control}
                            name="contactNumber"
                            label="Contact Number"
                            placeholder="+63 917 123 4567"
                            autoComplete="tel"
                            error={errors.contactNumber?.message}
                        />

                    </section>

                    <section className="profile-section">
                        <p className="eyebrow">SHIPPING ADDRESS</p>

                        <ValidatedField
                            control={control}
                            name="addressLine"
                            label="Street Address"
                            placeholder="e.g. 128 Ayala Avenue, Penthouse 4"
                            autoComplete="street-address"
                            error={errors.addressLine?.message}
                        />

                        <div className="form-row-2">
                            <ValidatedField
                                control={control}
                                name="city"
                                label="City"
                                placeholder="Makati"
                                autoComplete="address-level2"
                                error={errors.city?.message}
                            />

                            <ValidatedField
                                control={control}
                                name="postalCode"
                                label="Postal Code"
                                placeholder="1226"
                                autoComplete="postal-code"
                                error={errors.postalCode?.message}
                            />
                        </div>

                        <ValidatedField
                            control={control}
                            name="country"
                            label="Country"
                            placeholder="Philippines"
                            autoComplete="country-name"
                            error={errors.country?.message}
                        />
                    </section>

                    <div className="profile-actions" style={{ marginTop: "1.5rem" }}>
                        <button
                            type="submit"
                            className="gold-button"
                            disabled={updateLoading}
                        >
                            {updateLoading ? "Saving Changes..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>

            <SiteFooter />
        </main>
    );
}

export default ProfilePage;
