import { Link } from "react-router-dom";
import "./site.css";

export function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="site-footer__top">
                <Link to="/" className="site-logo">
                    AUREO
                </Link>

                <div className="site-footer__cols">
                    <div>
                        <h4>Shop</h4>
                        <Link to="/catalog">All watches</Link>
                        <Link to="/catalog?condition=new">New</Link>
                        <Link to="/catalog?condition=second-hand">Pre-owned</Link>
                    </div>
                    <div>
                        <h4>Services</h4>
                        <Link to="/services">Repair &amp; care</Link>
                        <Link to="/sell">Sell a watch</Link>
                        <Link to="/appraisals">Appraisals</Link>
                    </div>
                    <div>
                        <h4>Account</h4>
                        <Link to="/me">Profile</Link>
                        <Link to="/orders">Orders</Link>
                        <Link to="/wishlist">Wishlist</Link>
                    </div>
                </div>
            </div>

            <div className="site-footer__bottom">
                <span>© {year} Aureo</span>
            </div>
        </footer>
    );
}

export default SiteFooter;
