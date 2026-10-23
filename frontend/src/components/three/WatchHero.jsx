// The home page stage: one Three.js canvas that stays pinned behind the hero
// and the three "anatomy" chapters. As the visitor scrolls, the watch moves
// between poses (hero, case profile, dial close-up, bracelet).
//
// Rules from the specification that still apply:
//   * the canvas is lazy loaded and never blocks navigation
//   * a static fallback is used when WebGL is unavailable or on small screens
//   * `prefers-reduced-motion` disables the idle motion and the parallax
//   * only one canvas is used per page
//   * GPU resources are released when the component unmounts

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Float, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { WatchModel } from "./WatchModel";
import { RendererCleanup, StudioEnvironment } from "./Studio";
import { prefersReducedMotion, prefersSmallScreen, supportsWebGL } from "./capabilities";
import heroWatch from "../../assets/hero-watch.jpg";
import "./hero.css";

/* -------------------------------------------------------------------------- */
/* Choreography                                                               */
/* -------------------------------------------------------------------------- */

// One pose per section. `p` is the scroll progress through the stage.
const POSES = [
    { p: 0, x: 1.6, y: -0.05, z: 0, rx: 0.32, ry: -0.62, rz: 0.1 },
    { p: 1 / 3, x: -1.7, y: 0, z: 0.5, rx: 0.12, ry: -1.35, rz: 0 },
    { p: 2 / 3, x: 1.45, y: 0.05, z: 2.1, rx: 0.02, ry: -0.08, rz: 0 },
    { p: 1, x: -1.55, y: 0.25, z: 0.3, rx: -0.55, ry: 2.55, rz: 0.25 }
];

const smooth = (t) => t * t * (3 - 2 * t);

function poseAt(progress) {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    let index = 0;

    while (index < POSES.length - 2 && p > POSES[index + 1].p) {
        index += 1;
    }

    const a = POSES[index];
    const b = POSES[index + 1];
    const t = smooth(THREE.MathUtils.clamp((p - a.p) / (b.p - a.p), 0, 1));
    const lerp = (key) => a[key] + (b[key] - a[key]) * t;

    return { x: lerp("x"), y: lerp("y"), z: lerp("z"), rx: lerp("rx"), ry: lerp("ry"), rz: lerp("rz") };
}

function Rig({ progressRef, pointerRef, reducedMotion }) {
    const group = useRef(null);

    useFrame((state, delta) => {
        const node = group.current;
        if (!node) return;

        const pose = poseAt(progressRef?.current ?? 0);
        const narrow = state.size.width < 1000;
        const pointer = reducedMotion ? { x: 0, y: 0 } : pointerRef.current;
        const time = state.clock.elapsedTime;
        const idle = reducedMotion ? 0 : Math.sin(time * 0.6) * 0.06;
        const bob = reducedMotion ? 0 : Math.sin(time * 0.9) * 0.05;
        const lambda = reducedMotion ? 20 : 3.2;

        const targetX = pose.x * (narrow ? 0.55 : 1);
        node.position.x = THREE.MathUtils.damp(node.position.x, targetX, lambda, delta);
        node.position.y = THREE.MathUtils.damp(node.position.y, pose.y + bob, lambda, delta);
        node.position.z = THREE.MathUtils.damp(node.position.z, pose.z, lambda, delta);
        node.rotation.x = THREE.MathUtils.damp(node.rotation.x, pose.rx - pointer.y * 0.18, lambda, delta);
        node.rotation.y = THREE.MathUtils.damp(node.rotation.y, pose.ry + idle + pointer.x * 0.3, lambda, delta);
        node.rotation.z = THREE.MathUtils.damp(node.rotation.z, pose.rz, lambda, delta);
    });

    return (
        <group ref={group} position={[POSES[0].x, POSES[0].y, 0]} rotation={[POSES[0].rx, POSES[0].ry, POSES[0].rz]}>
            {/* The pivot sits between the case and the bracelet so the watch
                turns around its own centre of mass. */}
            <group scale={0.78} position={[0, 0, 0.55]}>
                <WatchModel reducedMotion={reducedMotion} />
            </group>
        </group>
    );
}

function InteractiveRig({ reducedMotion }) {
    return (
        <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={0.2} floatIntensity={0.4}>
            <group scale={0.8} position={[0, 0, 0.55]}>
                <WatchModel reducedMotion={reducedMotion} />
            </group>
        </Float>
    );
}

function Scene({ progressRef, pointerRef, reducedMotion, interactive }) {
    return (
        <>
            <RendererCleanup />
            <StudioEnvironment />

            <ambientLight intensity={0.2} />
            <directionalLight position={[4, 6, 6]} intensity={1.4} color="#fff3dc" />
            <directionalLight position={[-6, -2, -4]} intensity={0.8} color="#c9a45c" />

            {interactive ? (
                <>
                    <InteractiveRig reducedMotion={reducedMotion} />
                    <OrbitControls
                        enablePan={false}
                        enableZoom
                        minDistance={3.8}
                        maxDistance={10}
                        dampingFactor={0.08}
                        autoRotate={!reducedMotion}
                        autoRotateSpeed={0.7}
                    />
                </>
            ) : (
                <Rig progressRef={progressRef} pointerRef={pointerRef} reducedMotion={reducedMotion} />
            )}

            {!reducedMotion && (
                <Sparkles count={75} scale={[12, 7, 5]} size={2.2} speed={0.25} opacity={0.55} color="#e2bb76" />
            )}

            <AdaptiveDpr pixelated />
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export function WatchHero({ progressRef, interactive = false, className = "" }) {
    const containerRef = useRef(null);
    const pointerRef = useRef({ x: 0, y: 0 });
    const fallbackProgress = useRef(0);

    const [webgl] = useState(() => supportsWebGL());
    const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
    const [isSmallScreen, setIsSmallScreen] = useState(() => prefersSmallScreen());
    const [inView, setInView] = useState(true);

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

    // Mouse parallax. Read in the render loop, so it never re-renders React.
    useEffect(() => {
        const handlePointer = (event) => {
            pointerRef.current = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: (event.clientY / window.innerHeight) * 2 - 1
            };
        };

        window.addEventListener("pointermove", handlePointer, { passive: true });
        return () => window.removeEventListener("pointermove", handlePointer);
    }, []);

    // The render loop stops when the stage is scrolled out of view.
    useEffect(() => {
        const node = containerRef.current;
        if (!node || !("IntersectionObserver" in window)) return undefined;

        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
            rootMargin: "120px"
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    if (!webgl || isSmallScreen) {
        return (
            <div className={`hero-3d hero-3d-fallback ${className}`.trim()}>
                <img src={heroWatch} alt="" className="hero-fallback-image" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`hero-3d ${className}`.trim()}>
            <Canvas
                dpr={[1, 2]}
                frameloop={inView ? "always" : "never"}
                camera={{ position: [0, 0, 8], fov: 30 }}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                style={{ background: "transparent" }}
                fallback={<img src={heroWatch} alt="" className="hero-fallback-image" />}
            >
                <Suspense fallback={null}>
                    <Scene
                        progressRef={progressRef || fallbackProgress}
                        pointerRef={pointerRef}
                        reducedMotion={reducedMotion}
                        interactive={interactive}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}

export default WatchHero;
