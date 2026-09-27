import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H, MAX_FLOORS, paletteFor } from './world3d.js';
import { makeFlagTexture, makeWoodTexture } from './textures.js';

/**
 * Die Piraten-Welt in 3D: ein sanft schaukelndes Schiff auf gewelltem
 * Meer. Statt Turm-Etagen klettert die Figur an Plattformen den Mast
 * hoch – alle 5 Plattformen wartet ein goldenes Krähennest.
 */

const MAST_H = MAX_FLOORS * FLOOR_H + 6;
const DECK_Y = 0.72;

/** Gewelltes Meer (CPU-Wellen, Normale werden pro Frame neu gerechnet). */
function Sea({ palette }) {
  const mesh = useRef();
  const geometry = useMemo(() => new THREE.PlaneGeometry(95, 95, 34, 34), []);
  const base = useMemo(() => geometry.attributes.position.array.slice(), [geometry]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.array[i * 3 + 2] =
        Math.sin(x * 0.24 + t * 1.05) * 0.24 + Math.cos(y * 0.21 + t * 0.75) * 0.2;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    if (mesh.current) mesh.current.position.y = -0.55 + Math.sin(t * 0.5) * 0.06;
  });

  return (
    <mesh ref={mesh} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={palette.sea} roughness={0.55} metalness={0.15} flatShading />
    </mesh>
  );
}

/** Wehende Flagge am Heck. */
function Flag() {
  const texture = useMemo(() => makeFlagTexture(), []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1.7, 1.1, 8, 4), []);
  const base = useMemo(() => geometry.attributes.position.array.slice(), [geometry]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3];
      const wave = (x + 0.85) / 1.7; // 0 am Mast, 1 am Ende
      pos.array[i * 3 + 2] = Math.sin(x * 3.2 + t * 5) * 0.12 * wave;
    }
    pos.needsUpdate = true;
  });

  return (
    <group position={[-0.2, DECK_Y + 2.6, -6.9]}>
      <mesh position={[0, -1.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 3.4, 6]} />
        <meshStandardMaterial color="#54371e" roughness={0.9} />
      </mesh>
      <mesh geometry={geometry} position={[0.9, 0, 0]}>
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function PirateWorld({ theme }) {
  const palette = paletteFor(theme);
  const wood = useMemo(() => makeWoodTexture(palette.wood), [palette]);
  const ship = useRef();

  // Schiff schaukelt sanft
  useFrame(({ clock }) => {
    if (!ship.current) return;
    const t = clock.elapsedTime;
    ship.current.rotation.z = Math.sin(t * 0.5) * 0.018;
    ship.current.rotation.x = Math.sin(t * 0.37) * 0.012;
    ship.current.position.y = Math.sin(t * 0.45) * 0.08;
  });

  /* Rumpf als Drehkörper */
  const hullGeometry = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 8; i += 1) {
      const t = i / 8;
      points.push(new THREE.Vector2(0.25 + Math.sin(t * Math.PI * 0.62) * 3.0, t * 1.7));
    }
    return new THREE.LatheGeometry(points, 14);
  }, []);

  /* Plattformen am Mast (instanced) */
  const platforms = useRef();
  const platformGeometry = useMemo(() => new THREE.CylinderGeometry(0.78, 0.7, 0.1, 10), []);
  useLayoutEffect(() => {
    if (!platforms.current) return;
    const dummy = new THREE.Object3D();
    for (let n = 1; n <= MAX_FLOORS; n += 1) {
      dummy.position.set(0, DECK_Y + n * FLOOR_H, 0);
      dummy.updateMatrix();
      platforms.current.setMatrixAt(n - 1, dummy.matrix);
    }
    platforms.current.instanceMatrix.needsUpdate = true;
  }, []);

  /* Krähennester alle 5 Plattformen (instanced) */
  const nests = useRef();
  const nestRims = useRef();
  const nestGeometry = useMemo(() => new THREE.CylinderGeometry(1.08, 0.92, 0.55, 12, 1, true), []);
  const rimGeometry = useMemo(() => new THREE.TorusGeometry(1.08, 0.07, 8, 24), []);
  const nestCount = Math.floor(MAX_FLOORS / 5);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < nestCount; i += 1) {
      const y = DECK_Y + (i + 1) * 5 * FLOOR_H;
      dummy.position.set(0, y + 0.3, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      nests.current?.setMatrixAt(i, dummy.matrix);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.position.y = y + 0.58;
      dummy.updateMatrix();
      nestRims.current?.setMatrixAt(i, dummy.matrix);
    }
    if (nests.current) nests.current.instanceMatrix.needsUpdate = true;
    if (nestRims.current) nestRims.current.instanceMatrix.needsUpdate = true;
  }, [nestCount]);

  /* Strickleiter-Sprossen (instanced) */
  const rungs = useRef();
  const rungGeometry = useMemo(() => new THREE.BoxGeometry(0.56, 0.055, 0.055), []);
  const rungCount = Math.floor((MAST_H - 2) / 0.6);
  useLayoutEffect(() => {
    if (!rungs.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < rungCount; i += 1) {
      dummy.position.set(0, DECK_Y + 0.6 + i * 0.6, 0.62);
      dummy.updateMatrix();
      rungs.current.setMatrixAt(i, dummy.matrix);
    }
    rungs.current.instanceMatrix.needsUpdate = true;
  }, [rungCount]);

  /* Rahen + Segel */
  const sails = useRef([]);
  const sailGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(7, 3.1, 10, 5);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const u = (pos.getX(i) + 3.5) / 7;
      pos.setZ(i, -Math.sin(u * Math.PI) * 0.55);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  const SAIL_HEIGHTS = [15, 36, 60];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    sails.current.forEach((sail, i) => {
      if (sail) sail.rotation.y = Math.sin(t * 0.6 + i * 1.7) * 0.05;
    });
  });

  return (
    <>
      <Sea palette={palette} />
      <group ref={ship}>
        {/* Rumpf + Deck + Reling */}
        <mesh geometry={hullGeometry} position={[0, -1.15, 0]} scale={[1, 1, 2.3]} castShadow>
          <meshStandardMaterial map={wood} side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DECK_Y, 0]} scale={[1, 2.3, 1]} receiveShadow>
          <circleGeometry args={[3.0, 20]} />
          <meshStandardMaterial map={wood} roughness={0.9} />
        </mesh>
        <mesh position={[0, DECK_Y + 0.3, 0]} scale={[1, 1, 2.3]}>
          <cylinderGeometry args={[3.08, 3.08, 0.6, 20, 1, true]} />
          <meshStandardMaterial color={palette.woodDark} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>

        {/* Mast */}
        <mesh position={[0, DECK_Y + MAST_H / 2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.42, MAST_H, 12]} />
          <meshStandardMaterial map={wood} roughness={0.85} />
        </mesh>

        {/* Plattformen + Krähennester */}
        <instancedMesh ref={platforms} args={[platformGeometry, undefined, MAX_FLOORS]} frustumCulled={false}>
          <meshStandardMaterial map={wood} roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={nests} args={[nestGeometry, undefined, nestCount]} frustumCulled={false}>
          <meshStandardMaterial map={wood} side={THREE.DoubleSide} roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={nestRims} args={[rimGeometry, undefined, nestCount]} frustumCulled={false}>
          <meshBasicMaterial color={palette.gold} toneMapped={false} />
        </instancedMesh>

        {/* Strickleiter */}
        {[-0.28, 0.28].map((x, i) => (
          <mesh key={i} position={[x, DECK_Y + MAST_H / 2, 0.62]}>
            <cylinderGeometry args={[0.03, 0.03, MAST_H - 1, 5]} />
            <meshStandardMaterial color={palette.rope} roughness={1} />
          </mesh>
        ))}
        <instancedMesh ref={rungs} args={[rungGeometry, undefined, rungCount]} frustumCulled={false}>
          <meshStandardMaterial color={palette.rope} roughness={1} />
        </instancedMesh>

        {/* Rahen + Segel */}
        {SAIL_HEIGHTS.map((h, i) => (
          <group key={i} position={[0, DECK_Y + h, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 8.6, 8]} />
              <meshStandardMaterial map={wood} roughness={0.85} />
            </mesh>
            <mesh
              ref={(m) => {
                sails.current[i] = m;
              }}
              geometry={sailGeometry}
              position={[0, -1.75, -0.2]}
            >
              <meshStandardMaterial color={palette.sail} side={THREE.DoubleSide} roughness={0.95} />
            </mesh>
          </group>
        ))}

        <Flag />
      </group>
    </>
  );
}
