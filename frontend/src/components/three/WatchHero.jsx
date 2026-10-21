// Phase 11 / spec 3.2: the home hero is a single Three.js canvas.
//
// Rules from the specification:
//   * the canvas is lazy loaded and never blocks navigation
//   * a static fallback is used when WebGL is unavailable or on small screens
//   * `prefers-reduced-motion` disables the idle rotation
//   * only one canvas is used per page
//   * GPU resources are released when the component unmounts

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Float, OrbitControls } from "@react-three/drei";
import { WatchModel } from "./WatchModel";
import {
    prefersReducedMotion,
    prefersSmallScreen,
    supportsWebGL
} from "./capabilities";
import "./hero.css";

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Releases the WebGL renderer when the canvas unmounts.
 */
function RendererCleanup() {
    const { gl } = useThree();

    useEffect(() => {
        return () => {
            gl.dispose();
        };
    }, [gl]);

    return null;
}

/**
 * The idle rotation. It stops completely when reduced motion is requested.
 */
function IdleRotation({ enabled, speed = 0.35 }) {
    const group = useRef(null);

    useFrame((_, delta) => {
        if (!enabled || !group.current) {
            return;
        }

        group.current.rotation.y += delta * speed;
    });

    return (
        <group ref={group}>
            <Float speed={enabled ? 1.1 : 0} rotationIntensity={0.12} floatIntensity={0.35}>
                <WatchModel reducedMotion={!enabled} />
            </Float>
        </group>
    );
}

function Scene({ reducedMotion }) {
    return (
        <>
            <RendererCleanup />
            <ambientLight intensity={0.35} />
            <directionalLight position={[4, 6, 5]} intensity={1.7} color="#fff6e2" />
            <directionalLight position={[-5, -2, -4]} intensity={0.6} color="#c9a45c" />
            <spotLight position={[0, 8, 0]} angle={0.5} penumbra={1} intensity={1.1} color="#f4efe6" />

            <IdleRotation enabled={!reducedMotion} />

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                minPolarAngle={Math.PI / 3.2}
                maxPolarAngle={Math.PI / 1.8}
            />

            <AdaptiveDpr pixelated />
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export function WatchHero({ className = "" }) {
    // The capability check runs before the canvas is created, so a device
    // without WebGL never starts a GPU context it cannot use.
    const [webgl] = useState(() => supportsWebGL());
    const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
    const [isSmallScreen, setIsSmallScreen] = useState(() => prefersSmallScreen());

    useEffect(() => {
        const media = window.matchMedia("(max-width: 768px)");
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        const handleScreen = (event) => setIsSmallScreen(event.matches);
        const handleMotion = (event) => setReducedMotion(event.matches);

        media.addEventListener("change", handleScreen);
        motionQuery.addEventListener("change", handleMotion);

        return () => {
            media.removeEventListener("change", handleScreen);
            motionQuery.removeEventListener("change", handleMotion);
        };
    }, []);

    if (!webgl || isSmallScreen) {
        return (
            <div className={`hero-3d hero-3d-fallback ${className}`.trim()}>
                <div className="hero-watch-static" aria-hidden="true">
                    <div className="hero-watch-case">
                        <div className="hero-watch-dial">
                            <span className="hero-watch-hand hero-watch-hand-hour" />
                            <span className="hero-watch-hand hero-watch-hand-minute" />
                            <span className="hero-watch-hand hero-watch-hand-second" />
                            <span className="hero-watch-crown" />
                        </div>
                    </div>
                </div>
                <span className="hero-3d-note">
                    {isSmallScreen ? "3D preview available on larger screens" : "3D preview unavailable"}
                </span>
            </div>
        );
    }

    return (
        <div className={`hero-3d ${className}`.trim()}>
            <Canvas
                dpr={[1, 2]}
                camera={{ position: [0, 0.6, 5.2], fov: 38 }}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                style={{ background: "transparent" }}
                fallback={<div className="hero-3d-fallback" />}
            >
                <Suspense fallback={null}>
                    <Scene reducedMotion={reducedMotion} />
                </Suspense>
            </Canvas>
        </div>
    );
}

export default WatchHero;
