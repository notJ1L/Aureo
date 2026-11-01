import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconArrow } from "./icons";
import heroGold from "../../assets/hero-gold.jpg";
import heroSkeleton from "../../assets/hero-skeleton.jpg";
import heroDiver from "../../assets/hero-diver.jpg";
import "./luxuryHero.css";

const SLIDES = [
    {
        id: "gold",
        kicker: "CAPTURING LIFE · SWISS CALIBRE",
        titleMain: "ONE SECOND",
        titleItalic: "at a TIME.",
        subtitle:
            "A masterwork of 18K solid gold and black sunburst chronometry. Hand-regulated by certified master horologists for pieces that anchor your legacy.",
        image: heroGold,
        imageAlt: "Aureo 18K Gold Chronograph Watch on fine Italian leather",
        primaryCta: { text: "Explore Collection", link: "/catalog" },
        secondaryCta: { text: "Sell Your Watch", link: "/sell" },
        badges: ["18K Solid Gold", "Automatic Chronometer", "Verified Provenance", "Worldwide Insured Delivery"]
    },
    {
        id: "skeleton",
        kicker: "BESPOKE HOROLOGY · TOURBILLON CALIBRE",
        titleMain: "CUSTOM WATCHES",
        titleItalic: "FOR ANY OCCASION.",
        subtitle:
            "Intricate openworked skeleton dials and flying tourbillon calibres sculpted in aerospace titanium and carbon ceramic. True mechanical art on the wrist.",
        image: heroSkeleton,
        imageAlt: "Aureo Tourbillon Skeleton Complication Timepiece",
        primaryCta: { text: "Discover Complications", link: "/catalog?movement=automatic" },
        secondaryCta: { text: "Atelier Services", link: "/services" },
        badges: ["Tourbillon Escapement", "Titanium Monobloc", "Sapphire Crystal", "48-Hour Mechanical Audit"]
    },
    {
        id: "diver",
        kicker: "PROFESSIONAL CHRONOMETER · 600M",
        titleMain: "ABSOLUTE DEPTH &",
        titleItalic: "ENDURING PRECISION.",
        subtitle:
            "Engineered for abyssal depths with scratch-proof ceramic diving bezels, helium relief valves, and Swiss Super-LumiNova luminescence.",
        image: heroDiver,
        imageAlt: "Aureo Deep Sea Professional Dive Chronometer",
        primaryCta: { text: "Shop Dive Series", link: "/catalog?category=sports" },
        secondaryCta: { text: "Request Appraisal", link: "/sell" },
        badges: ["600m / 2000ft Certified", "Ceramic Unidirectional Bezel", "COSC Certified", "5-Year Vault Warranty"]
    }
];

export function LuxuryHero() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-advance slides every 7 seconds
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 7000);
        return () => clearInterval(timer);
    }, [isPaused]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    const slide = SLIDES[currentSlide];

    return (
        <section
            className="lx-hero-wrap"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Aureo Featured Horology Showcase"
        >
            {/* Background Slides */}
            <div className="lx-hero-bg-container">
                {SLIDES.map((s, idx) => (
                    <div
                        key={s.id}
                        className={`lx-hero-bg-slide ${idx === currentSlide ? "is-active" : ""}`}
                        aria-hidden={idx !== currentSlide}
                    >
                        <img
                            src={s.image}
                            alt={s.imageAlt}
                            className="lx-hero-watch-img"
                            loading={idx === 0 ? "eager" : "lazy"}
                        />
                        <div className="lx-hero-vignette" />
                    </div>
                ))}
            </div>

            {/* Content Foreground */}
            <div className="lx-hero-container">
                <div className="lx-hero-content-col" key={slide.id}>
                    <p className="lx-kicker">{slide.kicker}</p>

                    <h1 className="lx-hero-title">
                        <span className="lx-title-main">{slide.titleMain}</span>
                        <span className="lx-title-italic">{slide.titleItalic}</span>
                    </h1>

                    <p className="lx-hero-desc">{slide.subtitle}</p>

                    <div className="lx-hero-ctas">
                        <Link to={slide.primaryCta.link} className="btn-gold" id="hero-primary-cta">
                            {slide.primaryCta.text} <IconArrow />
                        </Link>
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => navigate(slide.secondaryCta.link)}
                            id="hero-secondary-cta"
                        >
                            {slide.secondaryCta.text}
                        </button>
                    </div>

                    <div className="lx-hero-trust-bar">
                        {slide.badges.map((b, i) => (
                            <span key={i} className="lx-trust-item">
                                <span className="lx-trust-dot" aria-hidden="true" />
                                {b}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Slider Controls (Bottom Bar) */}
                <div className="lx-hero-controls">
                    {/* Dots indicator */}
                    <div className="lx-hero-dots">
                        {SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`lx-hero-dot ${idx === currentSlide ? "is-active" : ""}`}
                                onClick={() => setCurrentSlide(idx)}
                                aria-label={`Switch to slide ${idx + 1}`}
                            >
                                <span className="lx-dot-inner" />
                            </button>
                        ))}
                        <span className="lx-slide-number">
                            0{currentSlide + 1} <span className="lx-slide-sep">/</span> 0{SLIDES.length}
                        </span>
                    </div>

                    {/* Left / Right Arrows */}
                    <div className="lx-hero-arrows">
                        <button
                            type="button"
                            className="lx-arrow-btn"
                            onClick={prevSlide}
                            aria-label="Previous timepiece highlight"
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            className="lx-arrow-btn"
                            onClick={nextSlide}
                            aria-label="Next timepiece highlight"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LuxuryHero;
