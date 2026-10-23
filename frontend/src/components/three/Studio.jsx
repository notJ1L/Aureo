// Shared studio lighting for every 3D scene.
//
// The reflections come from an environment that is built from light
// formers, so nothing is downloaded (no HDR file) and the gold always has
// long, clean highlights like a product photograph.

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

export function StudioEnvironment() {
    return (
        <Environment resolution={256} frames={1}>
            {/* Key strips: long soft boxes that draw bands along the case */}
            <Lightformer form="rect" intensity={3.2} color="#fff4de" position={[0, 4, 6]} scale={[12, 1.2, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
            <Lightformer form="rect" intensity={2.2} color="#fff4de" position={[-6, 0.5, 3]} scale={[1, 8, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
            <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[6, -1, 2]} scale={[1, 6, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />

            {/* Warm rim from behind */}
            <Lightformer form="ring" intensity={4} color="#e2bb76" position={[0, 2, -8]} scale={6} onUpdate={(self) => self.lookAt(0, 0, 0)} />

            {/* Top and floor fills */}
            <Lightformer form="circle" intensity={1.4} color="#ffffff" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={5} />
            <Lightformer form="rect" intensity={0.6} color="#c9a45c" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>
    );
}

/**
 * Releases the WebGL renderer when the canvas unmounts.
 */
export function RendererCleanup() {
    const { gl } = useThree();

    useEffect(() => {
        return () => {
            gl.dispose();
        };
    }, [gl]);

    return null;
}
