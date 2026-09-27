import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { makeGlowTexture } from './textures.js';

/**
 * Himmel-Deko: Sonne/Mond (Glow-Sprites), Regenbogen und Zauberfunken.
 * Alle folgen der Kamera bzw. schweben um den Turm und werden über den
 * geteilten sky-State ein- und ausgeblendet.
 */

export function Celestials({ sky }) {
  const group = useRef();
  const sunMat = useRef();
  const moonMat = useRef();

  const glowSun = useMemo(() => makeGlowTexture('#fff7cf', 'rgba(255,214,94,0)'), []);
  const glowMoon = useMemo(() => makeGlowTexture('#e8efff', 'rgba(160,180,255,0)'), []);

  useFrame(({ camera }) => {
    if (group.current) group.current.position.copy(camera.position);
    if (sunMat.current) sunMat.current.opacity = sky.sun;
    if (moonMat.current) moonMat.current.opacity = sky.moon;
  });

  return (
    <group ref={group}>
      <sprite position={[-90, 110, -220]} scale={[70, 70, 1]}>
        <spriteMaterial
          ref={sunMat}
          map={glowSun}
          transparent
          opacity={1}
          depthWrite={false}
          fog={false}
        />
      </sprite>
      <sprite position={[110, 130, -200]} scale={[52, 52, 1]}>
        <spriteMaterial
          ref={moonMat}
          map={glowMoon}
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
        />
      </sprite>
    </group>
  );
}

const RAINBOW_COLORS = ['#ff9ecb', '#ffd35e', '#7ee8fa'];

/** Pastell-Regenbogen aus drei Bögen hoch oben am Himmel. */
export function Rainbow({ sky }) {
  const group = useRef();
  const mats = useRef([]);

  const arcs = useMemo(
    () =>
      RAINBOW_COLORS.map((_, i) => {
        const radius = 150 - i * 7;
        return new THREE.TorusGeometry(radius, 3.2, 8, 48, Math.PI);
      }),
    []
  );

  useFrame(({ camera }) => {
    if (group.current) {
      group.current.position.set(
        camera.position.x + 40,
        camera.position.y - 40,
        camera.position.z - 240
      );
    }
    mats.current.forEach((mat) => {
      if (mat) mat.opacity = sky.rainbow * 0.75;
    });
  });

  return (
    <group ref={group}>
      {arcs.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            color={RAINBOW_COLORS[i]}
            transparent
            opacity={0}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Zauberfunken, die in den hohen Zonen um den Turm schweben. */
export function MagicDust({ sky }) {
  const points = useRef();
  const mat = useRef();
  const glow = useMemo(() => makeGlowTexture('#ffe9a8', 'rgba(255,214,94,0)'), []);

  const geometry = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = ((i * 0.61803398875) % 1) * Math.PI * 2;
      const radius = 5 + ((i * 37) % 16);
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 14 + ((i * 53) % 130);
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (points.current) points.current.rotation.y = clock.elapsedTime * 0.05;
    if (mat.current) {
      mat.current.opacity =
        sky.magic * (0.55 + Math.sin(clock.elapsedTime * 3.1) * 0.25);
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={mat}
        map={glow}
        color="#ffd35e"
        size={1.1}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
