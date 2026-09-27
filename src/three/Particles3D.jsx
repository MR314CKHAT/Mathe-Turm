import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H, paletteFor, standZ } from './world3d.js';
import { makeGlowTexture } from './textures.js';

/**
 * Belohnungs-Effekte in 3D: Konfetti-Explosion, Glitzerblitz und
 * Belohnungs-Regen (Sterne beim Schloss, Münzen bei den Piraten).
 * Jeder Effekt wird über einen Zähler (nonce) neu gestartet.
 */

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

/* ------------------------------------------------------------------ */
/* Konfetti-Explosion                                                  */
/* ------------------------------------------------------------------ */

const CONFETTI_COUNT = 44;

function ConfettiBurst({ nonce, theme, floor }) {
  const mesh = useRef();
  const state = useRef({ t: 99, seed: [], baseY: 0 });

  const geometry = useMemo(() => new THREE.PlaneGeometry(0.17, 0.26), []);
  const palette = paletteFor(theme);

  const lastNonce = useRef(nonce);
  useEffect(() => {
    if (nonce !== lastNonce.current) {
      lastNonce.current = nonce;
      if (nonce <= 0) return;
      const s = state.current;
      s.t = 0;
      s.baseY = floor * FLOOR_H + 1.4;
      s.seed = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const angle = (i / CONFETTI_COUNT) * Math.PI * 2 + (i % 3) * 0.3;
        const speed = 2.4 + ((i * 37) % 30) / 10;
        return {
          vx: Math.cos(angle) * speed,
          vy: 3.2 + ((i * 53) % 40) / 10,
          vz: Math.sin(angle) * speed,
          rx: ((i * 29) % 10) / 2,
          rz: ((i * 17) % 10) / 2,
          spin: 4 + ((i * 11) % 6),
        };
      });
      if (mesh.current) {
        for (let i = 0; i < CONFETTI_COUNT; i += 1) {
          mesh.current.setColorAt(
            i,
            tmpColor.set(palette.confetti[i % palette.confetti.length])
          );
        }
        mesh.current.instanceColor.needsUpdate = true;
      }
    }
  }); // bewusst ohne Dep-Liste: floor soll beim Restart frisch sein

  useFrame((_, delta) => {
    const s = state.current;
    if (!mesh.current || s.t > 1.15) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    s.t += delta;
    const t = s.t;
    mesh.current.visible = true;
    for (let i = 0; i < CONFETTI_COUNT; i += 1) {
      const p = s.seed[i];
      dummy.position.set(
        p.vx * t,
        s.baseY + p.vy * t - 4.5 * t * t,
        standZ(theme) + 0.3 + p.vz * t
      );
      dummy.rotation.set(p.rx + t * p.spin, 0, p.rz + t * p.spin * 0.7);
      const shrink = Math.max(0.01, 1 - Math.max(0, t - 0.75) * 2.4);
      dummy.scale.set(shrink, shrink, shrink);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, CONFETTI_COUNT]}
      frustumCulled={false}
      visible={false}
    >
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/* Belohnungs-Regen (Sterne / Münzen)                                  */
/* ------------------------------------------------------------------ */

const RAIN_COUNT = 24;

function RewardRain({ nonce, theme, floor }) {
  const mesh = useRef();
  const state = useRef({ t: 99, seed: [], baseY: 0 });

  const geometry = useMemo(() => {
    if (theme === 'pirate') {
      return new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12);
    }
    // flacher Stern
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? 0.2 : 0.085;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false });
  }, [theme]);

  const lastNonce = useRef(nonce);
  useEffect(() => {
    if (nonce !== lastNonce.current) {
      lastNonce.current = nonce;
      if (nonce <= 0) return;
      const s = state.current;
      s.t = 0;
      s.baseY = floor * FLOOR_H;
      s.seed = Array.from({ length: RAIN_COUNT }, (_, i) => ({
        x: -4 + ((i * 43) % 80) / 10,
        z: 2 + ((i * 31) % 60) / 10,
        delay: (i % 8) * 0.12,
        speed: 4 + ((i * 23) % 20) / 10,
        spin: 3 + ((i * 13) % 5),
      }));
    }
  });

  useFrame((_, delta) => {
    const s = state.current;
    if (!mesh.current || s.t > 2.4) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    s.t += delta;
    mesh.current.visible = true;
    for (let i = 0; i < RAIN_COUNT; i += 1) {
      const p = s.seed[i];
      const t = Math.max(0, s.t - p.delay);
      dummy.position.set(p.x, s.baseY + 7 - p.speed * t, p.z);
      dummy.rotation.set(t * p.spin, t * p.spin * 0.6, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, RAIN_COUNT]}
      frustumCulled={false}
      visible={false}
    >
      <meshStandardMaterial
        color={theme === 'pirate' ? '#ffd35e' : '#ffe27a'}
        metalness={0.55}
        roughness={0.25}
        emissive={theme === 'pirate' ? '#8a5a00' : '#b8860b'}
        emissiveIntensity={0.35}
      />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/* Glitzer-Blitz                                                       */
/* ------------------------------------------------------------------ */

const SPARKLE_COUNT = 30;

function SparkleFlash({ nonce, floor, theme }) {
  const points = useRef();
  const mat = useRef();
  const state = useRef({ t: 99, baseY: 0 });

  const glow = useMemo(() => makeGlowTexture('#ffffff', 'rgba(255,255,255,0)'), []);

  const geometry = useMemo(() => {
    const z0 = standZ(theme);
    const positions = new Float32Array(SPARKLE_COUNT * 3);
    for (let i = 0; i < SPARKLE_COUNT; i += 1) {
      const angle = ((i * 0.61803398875) % 1) * Math.PI * 2;
      const radius = 0.6 + ((i * 37) % 22) / 10;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = ((i * 53) % 28) / 10 - 0.4;
      positions[i * 3 + 2] = z0 + 0.3 + Math.sin(angle) * radius * 0.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [theme]);

  const lastNonce = useRef(nonce);
  useEffect(() => {
    if (nonce !== lastNonce.current) {
      lastNonce.current = nonce;
      if (nonce <= 0) return;
      state.current.t = 0;
      state.current.baseY = floor * FLOOR_H + 1.2;
    }
  });

  useFrame((_, delta) => {
    const s = state.current;
    if (!points.current || s.t > 0.8) {
      if (points.current) points.current.visible = false;
      return;
    }
    s.t += delta;
    points.current.visible = true;
    points.current.position.y = s.baseY;
    const p = s.t / 0.8;
    if (mat.current) {
      mat.current.opacity = 1 - p;
      mat.current.size = 0.35 + p * 0.9;
    }
  });

  return (
    <points ref={points} geometry={geometry} visible={false}>
      <pointsMaterial
        ref={mat}
        map={glow}
        color="#fff3b0"
        size={0.4}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Effects3D({ theme, floor, burst, rain, sparkle }) {
  return (
    <>
      <ConfettiBurst nonce={burst} theme={theme} floor={floor} />
      <RewardRain nonce={rain} theme={theme} floor={floor} />
      <SparkleFlash nonce={sparkle} floor={floor} theme={theme} />
    </>
  );
}
