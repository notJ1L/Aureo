import { toast } from "react-toastify";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

/**
 * Triggers a rich, luxury-styled notification when a timepiece is added to the bag.
 */
export function showCartAddedToast({ product, quantityInBag = 1, onViewBag, onCheckout }) {
    const image =
        product?.images?.[0]?.url ||
        product?.image ||
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=150&q=80";

    toast(
        ({ closeToast }) => (
            <div className="aureo-cart-toast">
                <div className="aureo-cart-toast__header">
                    <span className="aureo-cart-toast__check">✓</span>
                    <span className="aureo-cart-toast__kicker">ADDED TO VAULT BAG</span>
                </div>

                <div className="aureo-cart-toast__body">
                    <img
                        src={image}
                        alt={product?.name || "Timepiece"}
                        className="aureo-cart-toast__thumb"
                    />
                    <div className="aureo-cart-toast__info">
                        <span className="aureo-cart-toast__brand">{product?.brand}</span>
                        <strong className="aureo-cart-toast__title">{product?.name}</strong>
                        <span className="aureo-cart-toast__meta">
                            {formatPrice(product?.price)} &bull; Qty in bag: {quantityInBag}
                        </span>
                    </div>
                </div>

                <div className="aureo-cart-toast__actions">
                    <button
                        type="button"
                        className="aureo-cart-toast__btn aureo-cart-toast__btn--outline"
                        onClick={() => {
                            if (closeToast) closeToast();
                            if (onViewBag) onViewBag();
                        }}
                    >
                        View Bag
                    </button>
                    <button
                        type="button"
                        className="aureo-cart-toast__btn aureo-cart-toast__btn--gold"
                        onClick={() => {
                            if (closeToast) closeToast();
                            if (onCheckout) onCheckout();
                        }}
                    >
                        Checkout →
                    </button>
                </div>
            </div>
        ),
        {
            position: "top-right",
            autoClose: 4500,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            className: "aureo-cart-toast-shell"
        }
    );
}

