import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerUser, googleLogin, clearAuthError } from "../redux/actions/authActions";
import { ValidatedField } from "../components/ui/ValidatedField";
import { registerSchema } from "../utils/validationSchemas";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/aureo.css";

function RegisterPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated, loading, error, registeredEmail } = useSelector((state) => state.auth);

    const [stage, setStage] = useState("register");
    const [handledEmail, setHandledEmail] = useState(null);

    const {
        control: registerControl,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: registerErrors }
    } = useForm({
        resolver: yupResolver(registerSchema),
        mode: "onBlur",
        defaultValues: { name: "", email: "", password: "" }
    });

    if (registeredEmail && registeredEmail !== handledEmail) {
        setHandledEmail(registeredEmail);
        setStage("acknowledged");
    }

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const onRegister = (values) => {
        dispatch(registerUser({
            name: values.name,
            email: values.email,
            password: values.password
        }));
    };

    const handleGoogleSignIn = () => {
        dispatch(googleLogin());
    };

    return (
        <main className="auth-page page-enter">
            <div className="auth-bg" aria-hidden="true">
                <div className="auth-bg__image" />
                <div className="auth-bg__veil" />
            </div>

            <SiteHeader variant="solid" />

            <div className="auth-main">
                <section className="auth-card" style={{ width: "100%", maxWidth: "460px" }}>
                    {stage === "register" ? (
                        <>
                            <p className="eyebrow">JOIN AUREO</p>
                            <h1>Create your account</h1>
                            <p className="auth-description">
                                Create an account to save watches, place orders,
                                and request appraisals.
                            </p>

                            {error && (
                                <div className="auth-error">{error}</div>
                            )}

                            <button
                                type="button"
                                className="google-btn"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"/>
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
                                    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
                                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                                </svg>
                                Sign up with Google
                            </button>

                            <div className="auth-divider">
                                <span>or register with email</span>
                            </div>

                            <form onSubmit={handleRegisterSubmit(onRegister)} noValidate>
                                <ValidatedField
                                    control={registerControl}
                                    name="name"
                                    label="Name"
                                    placeholder="Marcus Aristain"
                                    autoComplete="name"
                                    error={registerErrors.name?.message}
                                />

                                <ValidatedField
                                    control={registerControl}
                                    name="email"
                                    label="Email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    error={registerErrors.email?.message}
                                />

                                <ValidatedField
                                    control={registerControl}
                                    name="password"
                                    label="Password"
                                    type="password"
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                    hint="Use at least 8 characters."
                                    error={registerErrors.password?.message}
                                />

                                <button
                                    type="submit"
                                    className="gold-button"
                                    disabled={loading}
                                    style={{ width: "100%", marginTop: "1rem" }}
                                >
                                    {loading ? "Creating account..." : "Create Account"}
                                </button>
                            </form>

                            <p className="auth-footer" style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                Already have an account?{" "}
                                <Link to="/login" style={{ color: "var(--gold)" }}>Sign in</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="eyebrow">REGISTRATION ACKNOWLEDGED</p>
                            <h1>Welcome to Aureo</h1>
                            <p className="auth-description">
                                Your Aureo Collector account has been registered. We have sent an official registration acknowledgement email to{" "}
                                <strong style={{ color: "var(--gold)" }}>{registeredEmail}</strong> confirming your registration with Aureo Horology Vault.
                            </p>

                            <div
                                className="auth-info"
                                style={{
                                    marginBottom: "1.25rem",
                                    lineHeight: 1.6
                                }}
                            >
                                Check your inbox at <strong>{registeredEmail}</strong> for your official Aureo registration confirmation notice.
                            </div>

                            <button
                                type="button"
                                className="gold-button"
                                onClick={() => navigate("/login")}
                                style={{ width: "100%", marginTop: "0.5rem" }}
                            >
                                Proceed to Sign In &rarr;
                            </button>
                        </>
                    )}
                </section>
            </div>

            <SiteFooter />
        </main>
    );
}

export default RegisterPage;
