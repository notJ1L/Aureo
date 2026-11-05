import { Link } from "react-router-dom";
import { IconHeart } from "./layout/icons";
import { AureoRating } from "./ui";
import "../styles/watchCard.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

/**
 * High-horology watch card with personality, depth, and collector cues.
 * Features status badges, calibre spec pill, star rating, champagne price,
 * and quick-inspect interaction.
 */
export function WatchCard({ watch, index = 0, wishlist }) {
    const isSold = watch.stock === 0;
    const isPreowned = watch.condition === "second-hand";
    
    // Tag badge with character
    const tag = isSold 
        ? "Archived / Sold" 
        : isPreowned 
        ? "Vault 1-of-1 Pre-Owned" 
        : "Chronometer Certified";

    const image = watch.images?.[0]?.url;
    
    // Calibre & case spec snippet
    const movementLabel = watch.movement 
        ? watch.movement.charAt(0).toUpperCase() + watch.movement.slice(1) 
        : "Automatic";
    const caseLabel = watch.caseSize ? `${watch.caseSize}mm` : null;
    const specSnippet = [movementLabel, caseLabel].filter(Boolean).join(" · ");

    const ratingVal = Number(watch.ratings || 5.0).toFixed(1);
    const reviewCount = watch.numOfReviews || 0;

    return (
        <article
            className={`watch-card ${isSold ? "is-sold" : ""}`}
            style={{ "--i": index % 12 }}
        >
            <div className="watch-card__halo" aria-hidden="true" />

            <Link to={`/product/${watch._id}`} className="watch-card__media" tabIndex={-1} aria-hidden="true">
                {image ? (
                    <img src={image} alt={watch.name} loading="lazy" />
                ) : (
                    <span className="watch-card__empty">No photograph available</span>
                )}
                
                {tag && (
                    <span className={`watch-card__tag ${isSold ? "tag--sold" : isPreowned ? "tag--preowned" : "tag--certified"}`}>
                        {tag}
                    </span>
                )}

                <div className="watch-card__hover-cta">
                    <span>Inspect Reference →</span>
                </div>
            </Link>

            {wishlist && (
                <button
                    type="button"
                    className={`watch-card__wish ${wishlist.active ? "is-active" : ""}`}
                    onClick={wishlist.onToggle}
                    aria-label={wishlist.active ? "Remove from wishlist" : "Save to wishlist"}
                    aria-pressed={wishlist.active}
                >
                    <IconHeart
                        width={17}
                        height={17}
                        fill={wishlist.active ? "currentColor" : "none"}
                    />
                </button>
            )}

            <Link to={`/product/${watch._id}`} className="watch-card__info">
                <div className="watch-card__header-row">
                    <span className="watch-card__brand">{watch.brand}</span>
                    {specSnippet && <span className="watch-card__spec-pill">{specSnippet}</span>}
                </div>

                <h3 className="watch-card__name">{watch.name}</h3>

                <div className="watch-card__meta-row">
                    <span className="watch-card__price">{formatPrice(watch.price)}</span>
                    <div className="watch-card__rating">
                        <AureoRating value={Number(ratingVal)} readOnly precision={0.5} size="small" />
                        <span className="watch-card__rating-score">{ratingVal}</span>
                        {reviewCount > 0 && <span className="watch-card__rating-count">({reviewCount})</span>}
                    </div>
                </div>
            </Link>
        </article>
    );
}

export default WatchCard;
