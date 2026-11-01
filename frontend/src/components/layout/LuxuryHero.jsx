import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrow } from "./icons";
import heroGold from "../../assets/hero-gold.jpg";
import heroSkeleton from "../../assets/hero-skeleton.jpg";
import heroDiver from "../../assets/hero-diver.jpg";
import "./luxuryHero.css";

const SLIDES = [
    {
        id: "gold",
        kicker: "Haute Horlogerie · Archival Vault",
        title: "Where Seconds Are Sculpted in Gold & Steel.",
        text: "A curated sanctuary of authenticated Swiss horology—hand-regulated across five positions and sealed in our vault for discerning collectors worldwide.",
        image: heroGold,
        imageAlt: "Gold chronograph watch on black leather",
        highlightTag: "Vault Spotlight",
        highlightTitle: "Patek Philippe Grand Complications",
        highlightSpec: "Ref. 5270P · Perpetual Calendar Chronograph",
        highlightBadge: "Geneva Seal Certified"
    },
    {
        id: "skeleton",
        kicker: "Openworked Architecture",
        title: "Mechanics Made Pure Art.",
        text: "Skeletonized tourbillons and high-frequency balance wheels revealing every breath of human craftsmanship inside the escapement.",
        image: heroSkeleton,
        imageAlt: "Skeleton dial watch with exposed escapement",
        highlightTag: "Master Piece",
        highlightTitle: "Audemars Piguet Double Balance Wheel",
        highlightSpec: "Openworked Calibre 3132 · 18K Frosted Gold",
        highlightBadge: "Full Box & Archival Extract"
    },
    {
        id: "diver",
        kicker: "Abyss Exploration",
        title: "Engineered for Extreme Depths.",
        text: "Titanium grade 5 and high-density ceramic tool watches tested for deep ocean saturation, extreme shocks, and zero-compromise legibility.",
        image: heroDiver,
        imageAlt: "Ceramic diver chronometer with luminous bezel",
        highlightTag: "Deep Sea Tool",
        highlightTitle: "Omega Seamaster Ultra Deep",
        highlightSpec: "Co-Axial Master Chronometer · 6,000m Water Resistance",
        highlightBadge: "METAS Certified ±0 to +5s"
    }
];

export function LuxuryHero() {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return undefined;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [paused]);

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
    };

    return (
        <section
            className="hero"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-label="Featured timepieces"
        >
            <div className="hero__stage" aria-hidden="true">
                {SLIDES.map((s, idx) => (
                    <div key={s.id} className={`hero__slide ${idx === current ? "is-active" : ""}`}>
                        <img src={s.image} alt={s.imageAlt} loading={idx === 0 ? "eager" : "lazy"} />
                    </div>
                ))}
                <div className="hero__shade" />
                <div className="hero__radial" />
            </div>

            <div className="hero__inner">
                {/* Main Editorial Copy — every slide is stacked so the block
                    keeps a constant height and nothing jumps on change. */}
                <div className="hero__copy">
                    <div className="hero__copy-stack">
                        {SLIDES.map((s, idx) => (
                            <div
                                key={s.id}
                                className={`hero__copy-layer ${idx === current ? "is-active" : ""}`}
                                aria-hidden={idx !== current}
                            >
                                <span className="hero__kicker">{s.kicker}</span>
                                <h1 className="hero__title">{s.title}</h1>
                                <p className="hero__text">{s.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="hero__actions">
                        <Link to="/catalog" className="btn-gold" id="hero-primary-cta">
                            Explore Curated Vault <IconArrow />
                        </Link>
                        <Link to="/sell" className="btn-ghost" id="hero-secondary-cta">
                            Request Private Appraisal
                        </Link>
                    </div>
                </div>

                {/* Floating Glass Spec Card — stacked slides keep the box the
                    same size so the watch name never shifts. */}
                <div className="hero__floating-card">
                    <div className="hero__card-glass">
                        <div className="hero__card-stack">
                            {SLIDES.map((s, idx) => (
                                <div
                                    key={s.id}
                                    className={`hero__card-layer ${idx === current ? "is-active" : ""}`}
                                    aria-hidden={idx !== current}
                                >
                                    <div className="hero__card-status">
                                        <span className="hero__card-dot" />
                                        <span className="hero__card-tag">{s.highlightTag}</span>
                                        <span className="hero__card-badge">{s.highlightBadge}</span>
                                    </div>
                                    <h4 className="hero__card-title">{s.highlightTitle}</h4>
                                    <p className="hero__card-spec">{s.highlightSpec}</p>
                                </div>
                            ))}
                        </div>

                        <Link to="/catalog" className="hero__card-link">
                            View Reference Specification →
                        </Link>
                    </div>
                </div>

                {/* Bottom Navigation Controls */}
                <div className="hero__controls">
                    <div className="hero__arrows">
                        <button
                            type="button"
                            className="hero__arrow"
                            onClick={prevSlide}
                            aria-label="Previous slide"
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            className="hero__arrow"
                            onClick={nextSlide}
                            aria-label="Next slide"
                        >
                            →
                        </button>
                    </div>

                    <div className="hero__dots" role="tablist" aria-label="Choose slide">
                        {SLIDES.map((s, idx) => (
                            <button
                                key={s.id}
                                type="button"
                                role="tab"
                                aria-selected={idx === current}
                                aria-label={`Slide ${idx + 1}`}
                                className={`hero__dot ${idx === current ? "is-active" : ""}`}
                                onClick={() => setCurrent(idx)}
                            >
                                <span className="hero__dot-num">0{idx + 1}</span>
                                <span className="hero__dot-bar" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LuxuryHero;
