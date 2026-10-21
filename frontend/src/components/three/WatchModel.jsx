// The watch is built from primitives so no `.glb` asset is required.
//
// The case is a gold cylinder, the dial is a dark disc, and the hands are
// thin boxes. The hands follow the live time unless the motion is reduced.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const GOLD = "#c9a45c";
const GOLD_DARK = "#8f7238";
const DIAL = "#12151a";

function buildHands() {
    const now = new Date();

    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    return {
        // The hands rotate around the Z axis, so the angle is negative on Y.
        second: -(seconds / 60) * Math.PI * 2,
        minute: -(minutes / 60) * Math.PI * 2,
        hour: -(hours / 12) * Math.PI * 2
    };
}

export function WatchModel({ reducedMotion = false }) {
    const secondRef = useRef(null);
    const minuteRef = useRef(null);
    const hourRef = useRef(null);
    const elapsed = useRef(0);

    const hands = useMemo(() => buildHands(), []);

    // The seconds hand sweeps in real time. When the visitor asked for
    // reduced motion the clock is frozen at the current time instead.
    useFrame((_, delta) => {
        if (reducedMotion) {
            return;
        }

        elapsed.current += delta;

        if (secondRef.current) {
            const sweep = (elapsed.current % 60) / 60;
            secondRef.current.rotation.z = hands.second - sweep * Math.PI * 2;
        }
    });

    const hourMarkers = useMemo(() => {
        return Array.from({ length: 12 }, (_, index) => {
            const angle = (index / 12) * Math.PI * 2;

            return {
                key: index,
                position: [Math.sin(angle) * 1.12, Math.cos(angle) * 1.12, 0.06],
                rotation: [0, 0, -angle]
            };
        });
    }, []);

    return (
        <group rotation={[Math.PI / 9, 0, 0]}>
            {/* Case */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.35, 1.35, 0.34, 96]} />
                <meshStandardMaterial
                    color={GOLD}
                    metalness={0.92}
                    roughness={0.22}
                    envMapIntensity={1.3}
                />
            </mesh>

            {/* Bezel */}
            <mesh position={[0, 0.18, 0]}>
                <torusGeometry args={[1.22, 0.11, 24, 96]} />
                <meshStandardMaterial color={GOLD_DARK} metalness={0.9} roughness={0.3} />
            </mesh>

            {/* Dial */}
            <mesh position={[0, 0.19, 0]}>
                <cylinderGeometry args={[1.16, 1.16, 0.04, 96]} />
                <meshStandardMaterial color={DIAL} metalness={0.4} roughness={0.6} />
            </mesh>

            {/* Hour markers */}
            {hourMarkers.map((marker) => (
                <mesh key={marker.key} position={marker.position} rotation={marker.rotation}>
                    <boxGeometry args={[0.07, 0.2, 0.04]} />
                    <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} />
                </mesh>
            ))}

            {/* Hands */}
            <group ref={hourRef} position={[0, 0.22, 0.05]} rotation={[0, 0, hands.hour]}>
                <mesh position={[0, 0.35, 0]}>
                    <boxGeometry args={[0.11, 0.7, 0.04]} />
                    <meshStandardMaterial color="#f4efe6" metalness={0.5} roughness={0.4} />
                </mesh>
            </group>

            <group ref={minuteRef} position={[0, 0.235, 0.07]} rotation={[0, 0, hands.minute]}>
                <mesh position={[0, 0.48, 0]}>
                    <boxGeometry args={[0.08, 0.96, 0.04]} />
                    <meshStandardMaterial color="#f4efe6" metalness={0.5} roughness={0.4} />
                </mesh>
            </group>

            <group ref={secondRef} position={[0, 0.245, 0.09]} rotation={[0, 0, hands.second]}>
                <mesh position={[0, 0.34, 0]}>
                    <boxGeometry args={[0.03, 1.12, 0.03]} />
                    <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} />
                </mesh>
            </group>

            {/* Crown */}
            <mesh position={[1.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.13, 0.13, 0.2, 24]} />
                <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.28} />
            </mesh>

            {/* Strap */}
            <mesh position={[0, -1.85, -0.02]} castShadow>
                <boxGeometry args={[1.05, 1.9, 0.16]} />
                <meshStandardMaterial color="#1a1d23" metalness={0.15} roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.85, -0.02]} castShadow>
                <boxGeometry args={[1.05, 1.9, 0.16]} />
                <meshStandardMaterial color="#1a1d23" metalness={0.15} roughness={0.85} />
            </mesh>

            {/* Strap buckle */}
            <mesh position={[0, 2.72, -0.02]}>
                <boxGeometry args={[1.1, 0.16, 0.2]} />
                <meshStandardMaterial color={GOLD_DARK} metalness={0.9} roughness={0.3} />
            </mesh>
        </group>
    );
}

export default WatchModel;
