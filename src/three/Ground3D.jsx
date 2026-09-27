import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { paletteFor } from './world3d.js';

/**
 * Der Schlossgarten: Wiese, Weg zur Tür, Brunnen, Büsche, bunte Blumen,
 * Tannenbäume und sanfte Hügel am Horizont (die im Nebel verschwinden).
 */

const FLOWER_COUNT = 46;

export default function Ground3D({ theme }) {
  const palette = paletteFor(theme);

  const flowers = useRef();
  const flowerGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(0.11, 0),
    []
  );

  useLayoutEffect(() => {
    if (!flowers.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < FLOWER_COUNT; i += 1) {
      const angle = ((i * 0.61803398875) % 1) * Math.PI * 2;
      const radius = 4.4 + ((i * 37) % 110) / 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Weg freihalten
      if (Math.abs(x) < 1.8 && z > 2) {
        dummy.position.set(x < 0 ? x - 2 : x + 2, 0.14, z);
      } else {
        dummy.position.set(x, 0.14, z);
      }
      dummy.updateMatrix();
      flowers.current.setMatrixAt(i, dummy.matrix);
      flowers.current.setColorAt(
        i,
        color.set(palette.flower[i % palette.flower.length])
      );
    }
    flowers.current.instanceMatrix.needsUpdate = true;
    if (flowers.current.instanceColor) {
      flowers.current.instanceColor.needsUpdate = true;
    }
  }, [palette]);

  return (
    <group>
      {/* Wiese */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[38, 48]} />
        <meshStandardMaterial color={palette.grass} roughness={1} />
      </mesh>

      {/* Weg zur Tür */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 8.5]} receiveShadow>
        <planeGeometry args={[2.4, 11]} />
        <meshStandardMaterial color={palette.path} roughness={1} />
      </mesh>

      {/* Brunnen */}
      <group position={[6, 0, 7.5]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[1.15, 1.3, 0.56, 14]} />
          <meshStandardMaterial color={palette.stoneDark} roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]}>
          <circleGeometry args={[1.0, 14]} />
          <meshBasicMaterial color="#7ecbf2" />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 0.8, 10]} />
          <meshStandardMaterial color={palette.stoneDark} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshBasicMaterial color="#aee3ff" />
        </mesh>
      </group>

      {/* Büsche */}
      {[
        [-5.5, 5.5, 1.1],
        [5.8, -3.5, 0.9],
        [-7.5, -5, 1.3],
        [9.5, 2.5, 1.0],
        [-3.5, 11, 0.8],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, s * 0.55, z]} scale={[s, s * 0.82, s]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={palette.bush} roughness={1} flatShading />
        </mesh>
      ))}

      {/* Blumen */}
      <instancedMesh
        ref={flowers}
        args={[flowerGeometry, undefined, FLOWER_COUNT]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>

      {/* Tannenbäume */}
      {[
        [-13, -9, 1.2],
        [14, -11, 1.5],
        [-19, 3, 1.0],
        [18, 8, 1.3],
      ].map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.3, 1, 8]} />
            <meshStandardMaterial color="#6b4a2f" roughness={1} />
          </mesh>
          <mesh position={[0, 1.7, 0]} castShadow>
            <coneGeometry args={[1.15, 2.1, 9]} />
            <meshStandardMaterial color={palette.bush} roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 3.0, 0]} castShadow>
            <coneGeometry args={[0.8, 1.6, 9]} />
            <meshStandardMaterial color={palette.bush} roughness={1} flatShading />
          </mesh>
        </group>
      ))}

      {/* Hügel am Horizont */}
      {[
        [-24, -22, 11],
        [6, -30, 13],
        [26, -18, 9],
        [-8, 30, 10],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, 0, z]} scale={[s, s * 0.35, s]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={palette.grassDark} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
