import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H, MAX_FLOORS, TOWER_R, paletteFor } from './world3d.js';
import {
  makeDoorTexture,
  makeStoneTexture,
  makeWindowTexture,
} from './textures.js';

/**
 * Die Schloss-Welt in 3D: gemauerter Rundturm mit Fenstern, die sich
 * golden um den Turm schrauben, goldenen Ringen an den Checkpoint-Etagen
 * (alle 5) und einer Rundbogentür unten. Die Spitze verschwindet im Nebel,
 * dadurch wirkt der Turm endlos.
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.4 rad
const WINDOW_DAY = new THREE.Color('#8fa8c8');
const WINDOW_NIGHT = new THREE.Color('#ffd35e');

export default function CastleWorld({ theme, floor, sky }) {
  const palette = paletteFor(theme);

  const stone = useMemo(
    () => makeStoneTexture(palette.stone, palette.mortar),
    [palette]
  );
  const windowTex = useMemo(
    () => makeWindowTexture('#bfe3ff', palette.stoneDark),
    [palette]
  );
  const doorTex = useMemo(
    () => makeDoorTexture(palette.door, palette.stoneDark),
    [palette]
  );

  const doorGeometry = useMemo(() => new THREE.PlaneGeometry(2.3, 2.9), []);

  /* ---------- Turmkörper ---------- */
  const towerHeight = MAX_FLOORS * FLOOR_H + 8;
  const towerGeometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        TOWER_R - 0.12,
        TOWER_R + 0.25,
        towerHeight,
        28,
        1,
        true
      ),
    [towerHeight]
  );

  /* ---------- Ringe zwischen den Etagen (instanced) ---------- */
  const rings = useRef();
  const ringGeometry = useMemo(
    () => new THREE.CylinderGeometry(TOWER_R + 0.1, TOWER_R + 0.1, 0.17, 28, 1, true),
    []
  );
  useLayoutEffect(() => {
    if (!rings.current) return;
    const dummy = new THREE.Object3D();
    for (let n = 1; n <= MAX_FLOORS; n += 1) {
      dummy.position.set(0, n * FLOOR_H, 0);
      dummy.updateMatrix();
      rings.current.setMatrixAt(n - 1, dummy.matrix);
    }
    rings.current.instanceMatrix.needsUpdate = true;
  }, []);

  /* ---------- Fenster-Spirale (instanced) ---------- */
  const windows = useRef();
  const windowMat = useRef();
  const windowGeometry = useMemo(() => new THREE.PlaneGeometry(0.85, 1.15), []);
  useLayoutEffect(() => {
    if (!windows.current) return;
    const dummy = new THREE.Object3D();
    for (let n = 1; n <= MAX_FLOORS; n += 1) {
      const angle = n * GOLDEN_ANGLE;
      dummy.position.set(
        Math.sin(angle) * (TOWER_R + 0.08),
        n * FLOOR_H - FLOOR_H / 2 + 0.35,
        Math.cos(angle) * (TOWER_R + 0.08)
      );
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      windows.current.setMatrixAt(n - 1, dummy.matrix);
    }
    windows.current.instanceMatrix.needsUpdate = true;
  }, []);

  /* ---------- Goldene Checkpoint-Ringe (alle 5 Etagen) ---------- */
  const checkpoints = useRef();
  const checkpointGeometry = useMemo(
    () => new THREE.TorusGeometry(TOWER_R + 0.12, 0.1, 10, 40),
    []
  );
  const checkpointCount = Math.floor(MAX_FLOORS / 5);
  useLayoutEffect(() => {
    if (!checkpoints.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < checkpointCount; i += 1) {
      dummy.position.set(0, (i + 1) * 5 * FLOOR_H, 0);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      checkpoints.current.setMatrixAt(i, dummy.matrix);
    }
    checkpoints.current.instanceMatrix.needsUpdate = true;
  }, [checkpointCount]);

  /* ---------- Markierung der aktuellen Etage ---------- */
  const marker = useRef();
  useFrame(({ clock }) => {
    if (marker.current) {
      const y = (sky ? sky.smoothFloor : floor) * FLOOR_H + 0.04;
      marker.current.position.y = y;
      const pulse = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.02;
      marker.current.scale.set(pulse, pulse, 1);
    }
    // Fenster glühen nachts warm
    if (windowMat.current && sky) {
      windowMat.current.color
        .copy(WINDOW_DAY)
        .lerp(WINDOW_NIGHT, Math.min(1, sky.night * 1.15));
    }
  });

  return (
    <group>
      {/* Turmkörper */}
      <mesh
        geometry={towerGeometry}
        position={[0, towerHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial map={stone} roughness={0.9} metalness={0} />
      </mesh>

      {/* Etagen-Ringe */}
      <instancedMesh
        ref={rings}
        args={[ringGeometry, undefined, MAX_FLOORS]}
        frustumCulled={false}
      >
        <meshStandardMaterial color={palette.stoneDark} roughness={0.95} />
      </instancedMesh>

      {/* Fenster */}
      <instancedMesh
        ref={windows}
        args={[windowGeometry, undefined, MAX_FLOORS]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          ref={windowMat}
          map={windowTex}
          transparent
          alphaTest={0.35}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Checkpoint-Ringe */}
      <instancedMesh
        ref={checkpoints}
        args={[checkpointGeometry, undefined, checkpointCount]}
        frustumCulled={false}
      >
        <meshBasicMaterial color={palette.trim} toneMapped={false} />
      </instancedMesh>

      {/* aktuelle Etage */}
      <mesh ref={marker} geometry={checkpointGeometry} position={[0, 0.04, 0]}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Tür unten */}
      <mesh geometry={doorGeometry} position={[0, 1.42, TOWER_R + 0.28]}>
        <meshBasicMaterial map={doorTex} transparent alphaTest={0.4} />
      </mesh>
    </group>
  );
}
