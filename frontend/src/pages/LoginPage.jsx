import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginUser, googleLogin, clearAuthError } from "../redux/actions/authActions";
import { ValidatedField } from "../components/ui/ValidatedField";
import { loginSchema } from "../utils/validationSchemas";
import "../styles/aureo.css";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(loginSchema),
        mode: "onBlur",
        defaultValues: { email: "", password: "" }
    });

    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const onSubmit = (values) => {
        dispatch(loginUser(values.email, values.password));
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
                <p className="eyebrow">AUREO MEMBERS ROOM</p>
                <h1>Sign in to Aureo</h1>
                <p className="auth-description">
                    Access your account, orders, wishlist, and services.
                </p>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
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
                    Continue with Google
                </button>

                <div className="auth-divider">
                    <span>or sign in with email</span>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <ValidatedField
                        control={control}
                        name="email"
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        error={errors.email?.message}
                    />

                    <ValidatedField
                        control={control}
                        name="password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        error={errors.password?.message}
                    />

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
                    <Link to="/register">Create an account</Link>
                </p>
            </section>
        </main>
    );
}

export default LoginPage;