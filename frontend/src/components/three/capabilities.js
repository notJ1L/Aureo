// Capability checks for the 3D hero.
//
// They live in their own module so the hero file only exports components,
// which keeps the React fast refresh working.

export function supportsWebGL() {
    if (typeof window === "undefined") {
        return false;
    }

    try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2") || canvas.getContext("webgl");

        if (!context) {
            return false;
        }

        // Release the probe context so it does not stay in the GPU budget.
        const loseContext = context.getExtension("WEBGL_lose_context");
        loseContext?.loseContext();

        return true;
    } catch {
        return false;
    }
}

export function prefersReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia) {
        return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function prefersSmallScreen(query = "(max-width: 768px)") {
    if (typeof window === "undefined" || !window.matchMedia) {
        return false;
    }

    return window.matchMedia(query).matches;
}
