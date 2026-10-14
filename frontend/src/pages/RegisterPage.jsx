import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function RegisterPage() {
    const navigate = useNavigate();

    const [stage, setStage] = useState("register");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        code: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            await api.post("/register", {
                name: form.name,
                email: form.email,
                password: form.password
            });

            setMessage("Verification code sent. Check your email.");
            setStage("verify");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            await api.post("/verify-email", {
                email: form.email,
                code: form.code
            });

            navigate("/login");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Verification failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <Link className="auth-back" to="/">
                Back to store
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
                            <p className="auth-error">{error}</p>
                        )}

                        <form onSubmit={handleRegister}>
                            <label>
                                Name
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
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
                                    minLength="8"
                                    required
                                />
                            </label>

                            <button
                                type="submit"
                                className="gold-button"
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Create account"}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Already a member?{" "}
                            <Link to="/login">Sign in</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <p className="eyebrow">EMAIL VERIFICATION</p>
                        <h1>Check your inbox</h1>
                        <p className="auth-description">
                            Enter the six-digit code sent to:
                            <br />
                            <strong>{form.email}</strong>
                        </p>

                        {message && (
                            <p className="auth-success">{message}</p>
                        )}

                        {error && (
                            <p className="auth-error">{error}</p>
                        )}

                        <form onSubmit={handleVerify}>
                            <label>
                                Verification code
                                <input
                                    name="code"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength="6"
                                    value={form.code}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <button
                                type="submit"
                                className="gold-button"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify email"}
                            </button>
                        </form>
                    </>
                )}
            </section>
        </main>
    );
}

export default RegisterPage;