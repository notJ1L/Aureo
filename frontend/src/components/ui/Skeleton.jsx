import "./skeleton.css";

/**
 * Base skeleton block. A soft light sweep travels across every block and the
 * sweep is staggered by `--i`, so the grid loads as a gentle wave.
 */
export function AureoSkeleton({ width, height, className = "", style = {}, round = false }) {
    return (
        <div
            className={`sk ${round ? "sk--round" : ""} ${className}`.trim()}
            style={{ width, height, ...style }}
            aria-hidden="true"
        />
    );
}

/** A tiny watch dial whose hands keep turning while content loads. */
function SkeletonDial() {
    return (
        <svg className="sk-dial" viewBox="0 0 48 48" aria-hidden="true">
            <circle className="sk-dial__ring" cx="24" cy="24" r="20" />
            <line className="sk-dial__hand sk-dial__hand--hour" x1="24" y1="24" x2="24" y2="14" />
            <line className="sk-dial__hand sk-dial__hand--minute" x1="24" y1="24" x2="24" y2="9" />
            <circle className="sk-dial__pin" cx="24" cy="24" r="1.6" />
        </svg>
    );
}

/** Mirrors <WatchCard>: image, brand, name, price. */
export function WatchCardSkeleton({ index = 0 }) {
    return (
        <div className="sk-card" style={{ "--i": index % 12 }} aria-hidden="true">
            <div className="sk-card__media sk">
                <SkeletonDial />
            </div>
            <div className="sk-card__info">
                <AureoSkeleton className="sk-line" width="32%" height="9px" />
                <AureoSkeleton className="sk-line" width="78%" height="14px" />
                <AureoSkeleton className="sk-line" width="38%" height="12px" />
            </div>
        </div>
    );
}

/** Mirrors the product detail layout: gallery on the left, details on the right. */
export function ProductDetailSkeleton() {
    return (
        <div className="sk-pdp" aria-busy="true" aria-label="Loading watch">
            <div className="sk-pdp__gallery">
                <div className="sk-pdp__media sk">
                    <SkeletonDial />
                </div>
                <div className="sk-pdp__thumbs">
                    {[0, 1, 2].map((i) => (
                        <AureoSkeleton key={i} className="sk-pdp__thumb" style={{ "--i": i }} />
                    ))}
                </div>
            </div>

            <div className="sk-pdp__details">
                <AureoSkeleton width="90px" height="10px" />
                <AureoSkeleton width="82%" height="34px" style={{ "--i": 1 }} />
                <AureoSkeleton width="34%" height="22px" style={{ "--i": 2 }} />
                <div className="sk-pdp__rule" />
                <AureoSkeleton width="100%" height="48px" style={{ "--i": 3 }} />
                <AureoSkeleton width="100%" height="12px" style={{ "--i": 4 }} />
                <AureoSkeleton width="92%" height="12px" style={{ "--i": 5 }} />
                <AureoSkeleton width="70%" height="12px" style={{ "--i": 6 }} />
            </div>
        </div>
    );
}

export default AureoSkeleton;
