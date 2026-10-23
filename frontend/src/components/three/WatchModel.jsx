// The watch is built procedurally, so no `.glb` asset is required.
//
// Construction notes:
//   * the case and the bezel are lathe-turned profiles, like a real case
//   * the dial is drawn on a canvas (sunburst, minute track, logo, date)
//   * the indices are applied gold batons with a lume strip
//   * the hands are extruded dauphine shapes that follow the live time
//   * the bracelet is a three-piece link instanced along a wrist curve
//
// The watch face points to +Z and 12 o'clock points to +Y.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const GOLD = "#e2bb76";
const GOLD_SHADOW = "#b98e4b";
const DIAL_Z = 0.215;

/* -------------------------------------------------------------------------- */
/* Dial texture                                                               */
/* -------------------------------------------------------------------------- */

function createDialTexture() {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const c = size / 2;

    // Base: a deep black lacquer that lifts slightly toward the top.
    const base = ctx.createRadialGradient(c, c * 0.78, 0, c, c, c);
    base.addColorStop(0, "#23262d");
    base.addColorStop(0.55, "#0d0f13");
    base.addColorStop(1, "#030304");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    // Sunburst: thin radial lines whose brightness follows a two-lobe
    // pattern, which is how a brushed sunray dial catches the light.
    ctx.save();
    ctx.translate(c, c);
    for (let i = 0; i < 900; i += 1) {
        const angle = (i / 900) * Math.PI * 2;
        const sheen = Math.pow(Math.abs(Math.sin(angle * 1 + 0.6)), 3);
        ctx.strokeStyle = `rgba(255, 236, 200, ${0.01 + sheen * 0.05})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * c, Math.sin(angle) * c);
        ctx.stroke();
    }

    // Minute track.
    ctx.strokeStyle = "rgba(226, 187, 118, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, c * 0.955, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, c * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 60; i += 1) {
        const angle = (i / 60) * Math.PI * 2;
        const major = i % 5 === 0;
        const inner = major ? c * 0.895 : c * 0.915;
        ctx.strokeStyle = major ? "#e2bb76" : "rgba(244, 239, 230, 0.6)";
        ctx.lineWidth = major ? 5 : 2;
        ctx.beginPath();
        ctx.moveTo(Math.sin(angle) * inner, -Math.cos(angle) * inner);
        ctx.lineTo(Math.sin(angle) * c * 0.955, -Math.cos(angle) * c * 0.955);
        ctx.stroke();
    }

    // Logo and dial text.
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if ("letterSpacing" in ctx) ctx.letterSpacing = "14px";
    ctx.fillStyle = "#e2bb76";
    ctx.font = `600 ${size * 0.07}px "Cormorant Garamond", "Playfair Display", Georgia, serif`;
    ctx.fillText("AUREO", 7, -c * 0.38);

    if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
    ctx.fillStyle = "rgba(244, 239, 230, 0.55)";
    ctx.font = `500 ${size * 0.022}px "DM Sans", Arial, sans-serif`;
    ctx.fillText("EST. 2026", 3, -c * 0.28);

    ctx.fillStyle = "rgba(244, 239, 230, 0.85)";
    ctx.font = `500 ${size * 0.028}px "DM Sans", Arial, sans-serif`;
    ctx.fillText("AUTOMATIC", 3, c * 0.34);

    ctx.fillStyle = "rgba(226, 187, 118, 0.85)";
    ctx.font = `italic 500 ${size * 0.03}px "Cormorant Garamond", Georgia, serif`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
    ctx.fillText("Chronomètre", 0, c * 0.43);

    // Date window at 3 o'clock.
    const day = new Date().getDate();
    const w = c * 0.15;
    const h = c * 0.12;
    const x = c * 0.6;
    ctx.fillStyle = "#e2bb76";
    ctx.fillRect(x - w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
    ctx.fillStyle = "#f6f1e7";
    ctx.fillRect(x - w / 2, -h / 2, w, h);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.fillStyle = "#111";
    ctx.font = `700 ${size * 0.045}px "DM Sans", Arial, sans-serif`;
    ctx.fillText(String(day), x, 3);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
}

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                           */
/* -------------------------------------------------------------------------- */

function lathe(points, segments = 128) {
    const geometry = new THREE.LatheGeometry(
        points.map(([r, h]) => new THREE.Vector2(r, h)),
        segments
    );
    // Lathe turns around Y. The watch axis is Z, so the profile is tipped.
    geometry.rotateX(Math.PI / 2);
    return geometry;
}

function dauphine(length, width, tail) {
    const shape = new THREE.Shape();
    shape.moveTo(0, -tail);
    shape.lineTo(width, 0);
    shape.lineTo(0, length);
    shape.lineTo(-width, 0);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 2
    });
}

function lumeStrip(length, width) {
    const shape = new THREE.Shape();
    shape.moveTo(0, length * 0.22);
    shape.lineTo(width * 0.38, length * 0.42);
    shape.lineTo(0, length * 0.86);
    shape.lineTo(-width * 0.38, length * 0.42);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
}

function buildTime() {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    return {
        second: -(seconds / 60) * Math.PI * 2,
        minute: -(minutes / 60) * Math.PI * 2,
        hour: -(hours / 12) * Math.PI * 2
    };
}

// The bracelet follows the shape of a wrist, from the 12 o'clock lugs around
// the back to the 6 o'clock lugs.
const WRIST_POINTS = [
    [1.5, -0.1],
    [1.88, -0.5],
    [2.06, -1.2],
    [1.92, -2.0],
    [1.35, -2.7],
    [0.5, -3.0],
    [-0.5, -3.0],
    [-1.35, -2.7],
    [-1.92, -2.0],
    [-2.06, -1.2],
    [-1.88, -0.5],
    [-1.5, -0.1]
];

/* -------------------------------------------------------------------------- */
/* Bracelet                                                                   */
/* -------------------------------------------------------------------------- */

function Bracelet({ polished, brushed }) {
    const centerRef = useRef(null);
    const outerRef = useRef(null);

    const { links, clasp } = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3(
            WRIST_POINTS.map(([y, z]) => new THREE.Vector3(0, y, z)),
            false,
            "centripetal"
        );

        const pitch = 0.235;
        const count = Math.floor(curve.getLength() / pitch);
        const xAxis = new THREE.Vector3(1, 0, 0);
        const result = [];

        for (let i = 0; i <= count; i += 1) {
            const u = i / count;
            const point = curve.getPointAt(u);
            const tangent = curve.getTangentAt(u).normalize();
            const normal = new THREE.Vector3().crossVectors(xAxis, tangent).normalize();
            const basis = new THREE.Matrix4().makeBasis(xAxis, tangent, normal);
            result.push({ point, basis, normal });
        }

        const mid = curve.getPointAt(0.5);
        const midTangent = curve.getTangentAt(0.5).normalize();
        const midNormal = new THREE.Vector3().crossVectors(xAxis, midTangent).normalize();
        const claspMatrix = new THREE.Matrix4().makeBasis(xAxis, midTangent, midNormal);
        claspMatrix.setPosition(mid.clone().addScaledVector(midNormal, 0.05));

        return { links: result, clasp: claspMatrix };
    }, []);

    const geometries = useMemo(
        () => ({
            center: new RoundedBoxGeometry(0.3, 0.2, 0.13, 3, 0.045),
            outer: new RoundedBoxGeometry(0.22, 0.215, 0.11, 3, 0.04),
            clasp: new RoundedBoxGeometry(0.84, 0.62, 0.12, 3, 0.05)
        }),
        []
    );

    useLayoutEffect(() => {
        const matrix = new THREE.Matrix4();
        const offset = new THREE.Matrix4();

        links.forEach(({ point, basis }, index) => {
            matrix.copy(basis).setPosition(point);
            centerRef.current?.setMatrixAt(index, matrix);

            [-0.27, 0.27].forEach((x, side) => {
                offset.makeTranslation(x, 0, -0.008);
                const outer = matrix.clone().multiply(offset);
                outerRef.current?.setMatrixAt(index * 2 + side, outer);
            });
        });

        if (centerRef.current) centerRef.current.instanceMatrix.needsUpdate = true;
        if (outerRef.current) outerRef.current.instanceMatrix.needsUpdate = true;
    }, [links]);

    useEffect(() => {
        return () => Object.values(geometries).forEach((geometry) => geometry.dispose());
    }, [geometries]);

    return (
        <group>
            <instancedMesh
                ref={centerRef}
                args={[geometries.center, polished, links.length]}
                castShadow
            />
            <instancedMesh
                ref={outerRef}
                args={[geometries.outer, brushed, links.length * 2]}
                castShadow
            />
            <mesh geometry={geometries.clasp} material={polished} matrixAutoUpdate={false} matrix={clasp} />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Watch                                                                      */
/* -------------------------------------------------------------------------- */

export function WatchModel({ reducedMotion = false, showBracelet = true }) {
    const hourRef = useRef(null);
    const minuteRef = useRef(null);
    const secondRef = useRef(null);

    const initial = useMemo(() => buildTime(), []);

    const materials = useMemo(() => {
        const dialTexture = createDialTexture();

        return {
            dialTexture,
            polished: new THREE.MeshPhysicalMaterial({
                color: GOLD,
                metalness: 1,
                roughness: 0.14,
                clearcoat: 0.5,
                clearcoatRoughness: 0.08,
                envMapIntensity: 1.5,
                side: THREE.DoubleSide
            }),
            brushed: new THREE.MeshPhysicalMaterial({
                color: GOLD_SHADOW,
                metalness: 1,
                roughness: 0.36,
                envMapIntensity: 1.3,
                side: THREE.DoubleSide
            }),
            dial: new THREE.MeshStandardMaterial({
                map: dialTexture,
                metalness: 0.3,
                roughness: 0.42
            }),
            flange: new THREE.MeshStandardMaterial({
                color: "#0c0d10",
                metalness: 0.6,
                roughness: 0.35,
                side: THREE.DoubleSide
            }),
            lume: new THREE.MeshStandardMaterial({
                color: "#f4ecd6",
                emissive: "#d9caa0",
                emissiveIntensity: 0.22,
                roughness: 0.55
            }),
            crystal: new THREE.MeshPhysicalMaterial({
                color: "#ffffff",
                metalness: 0,
                roughness: 0,
                transparent: true,
                opacity: 0.1,
                clearcoat: 1,
                clearcoatRoughness: 0,
                envMapIntensity: 2.4,
                depthWrite: false
            })
        };
    }, []);

    const geometries = useMemo(() => {
        const hourHand = dauphine(0.56, 0.065, 0.1);
        const minuteHand = dauphine(0.84, 0.05, 0.12);

        return {
            case: lathe([
                [0, -0.3],
                [1.08, -0.3],
                [1.2, -0.28],
                [1.29, -0.22],
                [1.34, -0.1],
                [1.36, 0.04],
                [1.34, 0.14],
                [1.28, 0.2],
                [1.2, 0.215]
            ]),
            bezel: lathe([
                [1.19, 0.2],
                [1.27, 0.235],
                [1.27, 0.27],
                [1.2, 0.32],
                [1.1, 0.335],
                [1.05, 0.325],
                [1.03, 0.3]
            ]),
            flange: lathe([
                [1.03, 0.3],
                [1.08, DIAL_Z]
            ]),
            lug: new RoundedBoxGeometry(0.26, 0.62, 0.3, 4, 0.09),
            marker: new RoundedBoxGeometry(0.075, 0.2, 0.035, 2, 0.012),
            markerTwin: new RoundedBoxGeometry(0.05, 0.21, 0.035, 2, 0.01),
            markerLume: new THREE.PlaneGeometry(0.028, 0.13),
            hourHand,
            minuteHand,
            hourLume: lumeStrip(0.56, 0.065),
            minuteLume: lumeStrip(0.84, 0.05)
        };
    }, []);

    useEffect(() => {
        return () => {
            materials.dialTexture.dispose();
            Object.values(materials).forEach((item) => item.dispose?.());
            Object.values(geometries).forEach((item) => item.dispose?.());
        };
    }, [materials, geometries]);

    // The hands follow the live time. With reduced motion they stay frozen
    // at the time the page was opened.
    useFrame(() => {
        if (reducedMotion) return;

        const time = buildTime();
        if (hourRef.current) hourRef.current.rotation.z = time.hour;
        if (minuteRef.current) minuteRef.current.rotation.z = time.minute;
        if (secondRef.current) secondRef.current.rotation.z = time.second;
    });

    const markers = useMemo(
        () =>
            Array.from({ length: 12 }, (_, index) => {
                const angle = (index / 12) * Math.PI * 2;
                const radius = 0.84;
                return {
                    index,
                    position: [Math.sin(angle) * radius, Math.cos(angle) * radius, DIAL_Z + 0.02],
                    rotation: [0, 0, -angle]
                };
            }),
        []
    );

    const lugs = [
        [-0.53, 1.3],
        [0.53, 1.3],
        [-0.53, -1.3],
        [0.53, -1.3]
    ];

    return (
        <group>
            {/* Case, bezel and inner flange */}
            <mesh geometry={geometries.case} material={materials.polished} castShadow receiveShadow />
            <mesh geometry={geometries.bezel} material={materials.polished} castShadow />
            <mesh geometry={geometries.flange} material={materials.flange} />

            {/* Lugs */}
            {lugs.map(([x, y]) => (
                <mesh
                    key={`${x}-${y}`}
                    geometry={geometries.lug}
                    material={materials.polished}
                    position={[x, y, -0.07]}
                    rotation={[y > 0 ? -0.28 : 0.28, 0, 0]}
                    castShadow
                />
            ))}

            {/* Crown */}
            <mesh position={[1.36, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.polished}>
                <cylinderGeometry args={[0.07, 0.07, 0.12, 24]} />
            </mesh>
            <mesh position={[1.47, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.polished}>
                <cylinderGeometry args={[0.15, 0.15, 0.17, 28, 1, false]} />
            </mesh>
            <mesh position={[1.47, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.brushed}>
                <cylinderGeometry args={[0.158, 0.158, 0.11, 28, 1, true]} />
            </mesh>

            {/* Dial */}
            <mesh position={[0, 0, DIAL_Z]} material={materials.dial} receiveShadow>
                <circleGeometry args={[1.08, 128]} />
            </mesh>

            {/* Applied indices */}
            {markers.map((marker) =>
                marker.index === 0 ? (
                    <group key="twelve" position={marker.position}>
                        {[-0.04, 0.04].map((x) => (
                            <group key={x} position={[x, 0, 0]}>
                                <mesh geometry={geometries.markerTwin} material={materials.polished} castShadow />
                                <mesh
                                    geometry={geometries.markerLume}
                                    material={materials.lume}
                                    position={[0, 0, 0.019]}
                                    scale={[0.6, 1, 1]}
                                />
                            </group>
                        ))}
                    </group>
                ) : (
                    <group key={marker.index} position={marker.position} rotation={marker.rotation}>
                        <mesh geometry={geometries.marker} material={materials.polished} castShadow />
                        <mesh geometry={geometries.markerLume} material={materials.lume} position={[0, 0, 0.019]} />
                    </group>
                )
            )}

            {/* Hands */}
            <group ref={hourRef} position={[0, 0, DIAL_Z + 0.045]} rotation={[0, 0, initial.hour]}>
                <mesh geometry={geometries.hourHand} material={materials.polished} castShadow />
                <mesh geometry={geometries.hourLume} material={materials.lume} position={[0, 0, 0.02]} />
            </group>

            <group ref={minuteRef} position={[0, 0, DIAL_Z + 0.07]} rotation={[0, 0, initial.minute]}>
                <mesh geometry={geometries.minuteHand} material={materials.polished} castShadow />
                <mesh geometry={geometries.minuteLume} material={materials.lume} position={[0, 0, 0.02]} />
            </group>

            <group ref={secondRef} position={[0, 0, DIAL_Z + 0.1]} rotation={[0, 0, initial.second]}>
                <mesh position={[0, 0.4, 0]} material={materials.polished} castShadow>
                    <boxGeometry args={[0.014, 1.16, 0.008]} />
                </mesh>
                <mesh position={[0, -0.16, 0]} material={materials.polished}>
                    <torusGeometry args={[0.035, 0.012, 12, 32]} />
                </mesh>
            </group>

            {/* Centre cap */}
            <mesh position={[0, 0, DIAL_Z + 0.11]} rotation={[Math.PI / 2, 0, 0]} material={materials.polished}>
                <cylinderGeometry args={[0.045, 0.045, 0.03, 32]} />
            </mesh>

            {/* Crystal */}
            <mesh position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]} material={materials.crystal}>
                <cylinderGeometry args={[1.05, 1.05, 0.03, 96]} />
            </mesh>

            {/* Caseback engraving ring */}
            <mesh position={[0, 0, -0.302]} material={materials.brushed}>
                <ringGeometry args={[0.72, 0.78, 96]} />
            </mesh>

            {showBracelet && (
                <Bracelet polished={materials.polished} brushed={materials.brushed} />
            )}
        </group>
    );
}

export default WatchModel;
