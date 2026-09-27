import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Flauschige Low-Poly-Wolken aus Kugeln. Sie stehen auf festen Welthöhen,
 * sodass die Kamera beim Klettern an ihnen vorbei (und durch sie hindurch)
 * fliegt – das macht den Aufstieg richtig spürbar.
 */

const CLOUDS = [
  { y: 7, radius: 10, scale: 1.0, speed: 0.10, phase: 0.0 },
  { y: 14, radius: 13, scale: 1.35, speed: -0.07, phase: 2.1 },
  { y: 22, radius: 9, scale: 0.8, speed: 0.12, phase: 4.0 },
  { y: 33, radius: 14, scale: 1.5, speed: 0.06, phase: 1.2 },
  { y: 47, radius: 11, scale: 1.1, speed: -0.09, phase: 3.3 },
  { y: 64, radius: 15, scale: 1.4, speed: 0.05, phase: 5.1 },
  { y: 84, radius: 12, scale: 1.2, speed: -0.06, phase: 0.8 },
  { y: 108, radius: 14, scale: 1.5, speed: 0.04, phase: 2.9 },
  { y: 136, radius: 12, scale: 1.3, speed: 0.05, phase: 4.6 },
  { y: 168, radius: 15, scale: 1.6, speed: -0.04, phase: 1.7 },
  { y: 205, radius: 13, scale: 1.4, speed: 0.04, phase: 3.9 },
  { y: 250, radius: 16, scale: 1.7, speed: -0.03, phase: 0.4 },
];

/** Eine Wolke: 3–4 Kugeln, teilweise abgeflacht. */
function Puff({ scale }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0, 0]} scale={[1.6, 1.0, 1.1]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} flatShading />
      </mesh>
      <mesh position={[1.2, 0.18, 0.2]} scale={[1.0, 0.72, 0.8]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#fdfdff" roughness={1} flatShading />
      </mesh>
      <mesh position={[-1.15, 0.1, -0.15]} scale={[0.9, 0.62, 0.72]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#f4f7ff" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

export default function Clouds() {
  const group = useRef();

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((cloud, i) => {
      const conf = CLOUDS[i];
      const angle = conf.phase + t * conf.speed;
      cloud.position.set(
        Math.cos(angle) * conf.radius,
        conf.y + Math.sin(t * 0.5 + conf.phase) * 0.5,
        Math.sin(angle) * conf.radius
      );
    });
  });

  return (
    <group ref={group}>
      {CLOUDS.map((conf, i) => (
        <group key={i} position={[conf.radius, conf.y, 0]}>
          <Puff scale={conf.scale} />
        </group>
      ))}
    </group>
  );
}
