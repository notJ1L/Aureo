// A 3D viewer on the product detail page.
//
// The visitor can drag to orbit and scroll to zoom. The viewer follows the
// same rules as the home hero: one canvas per page, a fallback when WebGL is
// missing, `prefers-reduced-motion` support, and resources released on
// unmount.

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls } from "@react-three/drei";
import { WatchModel } from "./WatchModel";
import { RendererCleanup, StudioEnvironment } from "./Studio";
import { prefersReducedMotion, supportsWebGL } from "./capabilities";
import "./hero.css";

export function ProductViewer({ productName = "watch" }) {
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
                shadows
                camera={{ position: [2.2, 1.2, 6.4], fov: 32 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
                fallback={<div className="product-viewer product-viewer-fallback" />}
                aria-label={`Interactive 3D view of ${productName}`}
            >
                <Suspense fallback={null}>
                    <RendererCleanup />
                    <StudioEnvironment />
                    <ambientLight intensity={0.15} />
                    <directionalLight position={[3, 6, 5]} intensity={1.3} color="#fff3dc" />
                    <directionalLight position={[-5, -2, -4]} intensity={0.7} color="#c9a45c" />

                    <Float
                        speed={reducedMotion ? 0 : 1.2}
                        rotationIntensity={reducedMotion ? 0 : 0.15}
                        floatIntensity={reducedMotion ? 0 : 0.4}
                    >
                        <group scale={0.82} position={[0, 0.15, 0.6]}>
                            <WatchModel reducedMotion={reducedMotion} />
                        </group>
                    </Float>

                    <ContactShadows
                        position={[0, -2.1, 0]}
                        opacity={0.55}
                        scale={9}
                        blur={2.6}
                        far={4}
                        color="#000000"
                    />

                    <OrbitControls
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={4}
                        maxDistance={10}
                        autoRotate={!reducedMotion}
                        autoRotateSpeed={0.8}
                        minPolarAngle={Math.PI / 5}
                        maxPolarAngle={Math.PI / 1.6}
                    />
                </Suspense>
            </Canvas>

            <p className="product-viewer-hint">Drag to rotate · Scroll to zoom</p>
        </div>
    );
}

export default ProductViewer;
