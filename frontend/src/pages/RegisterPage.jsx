import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, verifyEmail, googleLogin, clearAuthError } from "../redux/actions/authActions";

function RegisterPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated, loading, error, registeredEmail, verified } = useSelector((state) => state.auth);

    const [stage, setStage] = useState("register");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        code: ""
    });
    const [infoMsg, setInfoMsg] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (registeredEmail) {
            setStage("verify");
            setForm((prev) => ({ ...prev, email: registeredEmail }));
            setInfoMsg(`Verification code sent to ${registeredEmail}. Please check your inbox.`);
        }
    }, [registeredEmail]);

    useEffect(() => {
        if (verified) {
            navigate("/login");
        }
    }, [verified, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleRegister = (event) => {
        event.preventDefault();
        dispatch(registerUser({
            name: form.name,
            email: form.email,
            password: form.password
        }));
    };

    const handleVerify = (event) => {
        event.preventDefault();
        dispatch(verifyEmail(form.email, form.code));
    };

    const handleGoogleSignIn = () => {
        dispatch(googleLogin());
    };

    return (
        <main className="auth-page">
            <Link className="auth-back" to="/">
                ← Back to store
            </Link>

            <section className="auth-card">
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

                        <form onSubmit={handleRegister}>
                            <label>
                                Name
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Marcus Aristain"
                                    required
                                />
                            </label>

                            <label>
                                Email
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                />
                            </label>

                            <label>
                                Password
                                <input
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    minLength={6}
                                    required
                                />
                            </label>

                            <button
                                type="submit"
                                className="gold-button"
                                disabled={loading}
                            >
                                {loading ? "Creating account..." : "Continue to Verification"}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Already have an account?{" "}
                            <Link to="/login">Sign in</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <p className="eyebrow">VERIFY EMAIL</p>
                        <h1>Confirm your code</h1>
                        <p className="auth-description">
                            Enter the 6-digit confirmation code sent to your email to activate your account.
                        </p>

                        {infoMsg && (
                            <div className="auth-info">{infoMsg}</div>
                        )}

                        {error && (
                            <div className="auth-error">{error}</div>
                        )}

                        <form onSubmit={handleVerify}>
                            <label>
                                Email
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    readOnly
                                />
                            </label>

                            <label>
                                Verification Code
                                <input
                                    name="code"
                                    value={form.code}
                                    onChange={handleChange}
                                    placeholder="e.g. 123456"
                                    maxLength={6}
                                    style={{ letterSpacing: "0.3rem", fontSize: "1.2rem", textAlign: "center" }}
                                    required
                                />
                            </label>

                            <button
                                type="submit"
                                className="gold-button"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify & Activate Account"}
                            </button>

                            <button
                                type="button"
                                className="outline-button"
                                onClick={() => setStage("register")}
                                style={{ width: "100%", marginTop: "0.5rem" }}
                            >
                                Back to registration
                            </button>
                        </form>

                        <p className="auth-footer">
                            Already verified?{" "}
                            <Link to="/login">Sign in here</Link>
                        </p>
                    </>
                )}
            </section>
        </main>
    );
}

export default RegisterPage;