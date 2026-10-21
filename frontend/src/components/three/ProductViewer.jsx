// Phase 11 / spec 3.2: a small 3D viewer on the product detail page.
//
// The specification calls this "a small 3D viewer or a rotatable gallery for
// the selected watch". The gallery is already there, so this adds the 3D
// half: the visitor can drag the watch to look at it from any angle.
//
// The viewer follows the same rules as the home hero: one canvas per page,
// a fallback when WebGL is missing, `prefers-reduced-motion` support, and
// resources released on unmount.

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { WatchModel } from "./WatchModel";
import { prefersReducedMotion, supportsWebGL } from "./capabilities";
import "./hero.css";

/**
 * Releases the WebGL renderer when the viewer unmounts.
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
 * A very slow idle turn, so the watch reads as a physical object when the
 * visitor is not dragging it.
 */
function IdleTurn({ enabled }) {
    const group = useRef(null);

    useFrame((_, delta) => {
        if (!enabled || !group.current) {
            return;
        }

        group.current.rotation.y += delta * 0.18;
    });

    return (
        <group ref={group}>
            <WatchModel reducedMotion={!enabled} />
        </group>
    );
}

export function ProductViewer({ productName = "watch" }) {
    // The capability check runs before the canvas is created, so a device
    // without WebGL never starts a GPU context it cannot use.
    const [webgl] = useState(() => supportsWebGL());
    const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());

    useEffect(() => {
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleMotion = (event) => setReducedMotion(event.matches);

        motionQuery.addEventListener("change", handleMotion);

        return () => motionQuery.removeEventListener("change", handleMotion);
    }, []);

    if (!webgl) {
        return (
            <div className="product-viewer product-viewer-fallback">
                <p>3D preview is unavailable in this browser.</p>
            </div>
        );
    }

    return (
        <div className="product-viewer">
            <Canvas
                dpr={[1, 2]}
                camera={{ position: [0, 0.4, 4.6], fov: 40 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
                fallback={<div className="product-viewer product-viewer-fallback" />}
                aria-label={`Interactive 3D view of ${productName}`}
            >
                <Suspense fallback={null}>
                    <RendererCleanup />
                    <ambientLight intensity={0.45} />
                    <directionalLight position={[3, 5, 4]} intensity={1.8} color="#fff6e2" />
                    <directionalLight position={[-4, -2, -3]} intensity={0.7} color="#c9a45c" />
                    <spotLight position={[0, 6, 2]} angle={0.6} penumbra={1} intensity={0.9} />

                    <IdleTurn enabled={!reducedMotion} />

                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.1}
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 1.7}
                    />
                </Suspense>
            </Canvas>

            <p className="product-viewer-hint">Drag to rotate</p>
        </div>
    );
}

export default ProductViewer;
