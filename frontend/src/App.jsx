import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import RegisterPage from "./pages/RegisterPage";
import api from "./services/api";

function StoreLanding() {
    const [notice, setNotice] = useState("");

    const showNotice = (message) => {
        setNotice(message);

        window.setTimeout(() => {
            setNotice("");
        }, 2600);
    };

    const formatPrice = (price) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price);
};

    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState("");

useEffect(() => {
    const loadProducts = async () => {
        try {
            const response = await api.get("/products");
            setProducts(response.data.products);
        } catch (requestError) {
            setProductsError(
                requestError.response?.data?.message ||
                "Unable to load products"
            );
        } finally {
            setProductsLoading(false);
        }
    };

    loadProducts();
}, []);

    return (
        <main className="storefront">
            <header className="navbar">
                <a className="logo" href="#top">AUREO</a>

                <nav className="nav-links">
                    <a href="#collection">Collection</a>
                    <a href="#services">Services</a>
                    <a href="#story">The Aureo Standard</a>
                </nav>

                <div className="nav-actions">
                    <button
                        type="button"
                        className="nav-action"
                        onClick={() => showNotice("Search will be available soon.")}
                    >
                        Search
                    </button>
                    <Link className="nav-action" to="/login">
                      Account
                    </Link>
                    <button
                        type="button"
                        className="cart-button"
                        onClick={() => showNotice("Your cart is currently empty.")}
                    >
                        Cart <span>0</span>
                    </button>
                </div>
            </header>

            <section id="top" className="hero-section">
                <div className="hero-copy">
                    <p className="eyebrow">CURATED WATCHES / EST. 2026</p>
                    <h1>Wear something worth remembering.</h1>
                    <p className="hero-description">
                        A considered collection of mechanical watches, rare finds,
                        and trusted aftercare for the pieces that mark your time.
                    </p>

                    <div className="hero-actions">
                        <a className="gold-button" href="#collection">
                            Explore collection
                        </a>
                        <button
                            type="button"
                            className="outline-button"
                            onClick={() => showNotice("Appraisal service coming next.")}
                        >
                            Sell your watch
                        </button>
                    </div>

                    <div className="hero-meta">
                        <span>Free local delivery</span>
                        <span>Verified pieces</span>
                        <span>Aftercare available</span>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-label">FEATURED PIECE / 001</div>
                    <img
                        src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90"
                        alt="Gold watch on a dark surface"
                    />
                    <div className="visual-caption">
                        <strong>Quiet precision.</strong>
                        <span>Automatic movement / 40mm case</span>
                    </div>
                </div>
            </section>

            <section id="collection" className="collection-section">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">THE CURRENT EDIT</p>
                        <h2>Selected watches</h2>
                    </div>

                    <button
                        type="button"
                        className="text-link"
                        onClick={() => showNotice("Full catalog coming next.")}
                    >
                        View all watches
                    </button>
                </div>

                <div className="filter-row">
                    <button type="button" className="filter-chip active">All pieces</button>
                    <button type="button" className="filter-chip">New</button>
                    <button type="button" className="filter-chip">Pre-owned</button>
                    <button type="button" className="filter-chip">Automatic</button>
                    <span className="result-count">04 pieces</span>
                </div>

                <div className="product-grid">
                    {productsLoading && (
    <p className="catalog-message">
        Loading the collection...
    </p>
)}

{productsError && (
    <p className="catalog-message error">
        {productsError}
    </p>
)}

{!productsLoading &&
    !productsError &&
    products.map((product) => (
        <article className="product-card" key={product._id}>
            <div className="product-image">
                <img
                    src={
                        product.images?.[0]?.url ||
                        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49"
                    }
                    alt={product.name}
                />
                <span>
                    {product.stock === 0
                        ? "Sold"
                        : product.condition}
                </span>
            </div>

            <div className="product-info">
                <p className="product-brand">
                    {product.brand}
                </p>

                <h3>{product.name}</h3>

                <div className="product-bottom">
                    <strong>
                        {formatPrice(product.price)}
                    </strong>

                    <button
                        type="button"
                        onClick={() =>
                            showNotice(`${product.name} selected.`)
                        }
                    >
                        View piece
                    </button>
                </div>
            </div>
        </article>
    ))}
                </div>
            </section>

            <section id="services" className="service-strip">
                <div>
                    <p className="eyebrow">BEYOND THE SALE</p>
                    <h2>Keep your timepiece in its best condition.</h2>
                </div>

                <div className="service-items">
                    <span>01 / Cleaning</span>
                    <span>02 / Repair</span>
                    <span>03 / Appraisal</span>
                </div>
            </section>

            <section id="story" className="story-section">
                <p className="eyebrow">THE AUREO STANDARD</p>
                <p className="story-copy">
                    Every piece deserves a clear history, an honest description,
                    and the right care after it leaves our hands.
                </p>
            </section>

            <footer className="footer">
                <span className="logo">AUREO</span>
                <span>Watches with a point of view.</span>
                <span>Local showroom / Online collection</span>
            </footer>

            {notice && <div className="toast">{notice}</div>}
        </main>
        
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<StoreLanding />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;