import { Link } from "react-router-dom";
import "./site.css";

export function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="site-footer__top">
                <div className="site-footer__brand">
                    <Link to="/" className="site-logo">
                        <span className="site-logo__mark" aria-hidden="true" />
                        AUREO
                    </Link>
                    <p>
                        A considered house of fine watches. Verified pieces, honest
                        descriptions, and aftercare for the moments that matter.
                    </p>
                </div>

                <div className="site-footer__cols">
                    <div>
                        <h4>Shop</h4>
                        <Link to="/catalog">All watches</Link>
                        <Link to="/catalog?condition=new">New arrivals</Link>
                        <Link to="/catalog?condition=second-hand">Pre-owned</Link>
                        <Link to="/wishlist">Wishlist</Link>
                    </div>
                    <div>
                        <h4>Services</h4>
                        <Link to="/services">Cleaning &amp; repair</Link>
                        <Link to="/sell">Sell your watch</Link>
                        <Link to="/appraisals">Appraisals</Link>
                    </div>
                    <div>
                        <h4>Account</h4>
                        <Link to="/me">Profile</Link>
                        <Link to="/orders">Orders</Link>
                        <Link to="/cart">Shopping bag</Link>
                    </div>
                </div>
            </div>

            <div className="site-footer__wordmark" aria-hidden="true">AUREO</div>

            <div className="site-footer__bottom">
                <span>© {year} Aureo. All rights reserved.</span>
                <span>Local showroom · Online collection</span>
            </div>
        </footer>
    );
}

export default SiteFooter;
