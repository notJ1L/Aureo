import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function LoginPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/login", form);

            localStorage.setItem(
                "aureoToken",
                response.data.token
            );

            navigate("/");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to sign in"
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
                <p className="eyebrow">AUREO MEMBERS ROOM</p>
                <h1>Sign in to Aureo</h1>
                <p className="auth-description">
                    Access your account, orders, wishlist, and services.
                </p>

                {error && (
                    <p className="auth-error">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
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
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="gold-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    New to Aureo?{" "}
                    <span>Registration will be connected next.</span>
                </p>
            </section>
        </main>
    );
}

export default LoginPage;