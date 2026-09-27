import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H, paletteFor, standZ } from './world3d.js';

/**
 * Die Spielfigur als Low-Poly-Chibi: Prinzessin (Schloss) oder Piratin
 * (Mast). Sie steht auf einer Plattform am Turm, hüpft bei jeder richtigen
 * Antwort eine Etage höher (Feder mit Überschwinger) und kennt die
 * Stimmungen idle / cheer / sad.
 */

const damp = THREE.MathUtils.damp;

function Face({ skin, eyeColor = '#43220f', patch = false }) {
  return (
    <group>
      {/* Augen */}
      <mesh position={[-0.13, 0.03, 0.31]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      {patch ? (
        <mesh position={[0.14, 0.04, 0.315]} rotation={[0, 0.25, 0]}>
          <circleGeometry args={[0.085, 12]} />
          <meshBasicMaterial color="#232f42" />
        </mesh>
      ) : (
        <mesh position={[0.13, 0.03, 0.31]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
      )}
      {/* Mund (kleiner Bogen) */}
      <mesh position={[0, -0.1, 0.32]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.09, 0.022, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#5b2352" />
      </mesh>
    </group>
  );
}

function PrincessBody({ palette, armL, armR, head }) {
  return (
    <>
      {/* Umhang */}
      <mesh position={[0, 0.62, -0.22]} rotation={[0.28, 0, 0]} castShadow>
        <coneGeometry args={[0.5, 1.15, 10, 1, true]} />
        <meshStandardMaterial color={palette.cape} roughness={0.85} flatShading side={THREE.DoubleSide} />
      </mesh>
      {/* Kleid */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.58, 1.1, 12]} />
        <meshStandardMaterial color={palette.dress} roughness={0.8} flatShading />
      </mesh>
      {/* Schürze */}
      <mesh position={[0, 0.5, 0.2]} rotation={[-0.15, 0, 0]}>
        <coneGeometry args={[0.34, 0.85, 8, 1, true]} />
        <meshStandardMaterial color="#ffe3f1" roughness={0.85} flatShading side={THREE.DoubleSide} />
      </mesh>
      {/* Körper */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.3, 6, 12]} />
        <meshStandardMaterial color={palette.dress} roughness={0.8} />
      </mesh>
      {/* Arme */}
      <group ref={armL} position={[-0.32, 1.16, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.3, 4, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.75} />
        </mesh>
      </group>
      <group ref={armR} position={[0.32, 1.16, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.3, 4, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.75} />
        </mesh>
      </group>
      {/* Kopf */}
      <group ref={head} position={[0, 1.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 16, 14]} />
          <meshStandardMaterial color={palette.skin} roughness={0.75} />
        </mesh>
        {/* Haare */}
        <mesh position={[0, 0.1, -0.09]} scale={[1.05, 1.0, 1.02]}>
          <sphereGeometry args={[0.33, 14, 12]} />
          <meshStandardMaterial color={palette.hair} roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 0.36, -0.16]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color={palette.hair} roughness={0.9} flatShading />
        </mesh>
        {/* Krone */}
        <group position={[0, 0.42, 0.02]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.16, 0.12, 10]} />
            <meshStandardMaterial color={palette.crown} roughness={0.35} metalness={0.4} />
          </mesh>
          {[-0.09, 0, 0.09].map((x, i) => (
            <mesh key={i} position={[x, 0.11, 0]}>
              <coneGeometry args={[0.035, 0.1, 6]} />
              <meshStandardMaterial color={palette.crown} roughness={0.35} metalness={0.4} />
            </mesh>
          ))}
        </group>
        <Face skin={palette.skin} />
      </group>
    </>
  );
}

function PirateBody({ palette, armL, armR, head }) {
  return (
    <>
      {/* Beine + Stiefel */}
      {[-0.13, 0.13].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.5, 8]} />
            <meshStandardMaterial color={palette.pants} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.09, 0.05]} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.3]} />
            <meshStandardMaterial color={palette.vest} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Ringelshirt */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.45, 6, 12]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.85} />
      </mesh>
      {[0.72, 0.92].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.29, 0.035, 6, 16]} />
          <meshStandardMaterial color={palette.stripe} roughness={0.85} />
        </mesh>
      ))}
      {/* Gürtel + Schnalle */}
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.29, 0.3, 0.12, 12]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.58, 0.29]}>
        <boxGeometry args={[0.12, 0.1, 0.04]} />
        <meshStandardMaterial color={palette.gold} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Arme */}
      <group ref={armL} position={[-0.36, 1.05, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.75} />
        </mesh>
        {/* Haken */}
        <mesh position={[0, -0.42, 0.02]} rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[0.06, 0.02, 6, 10, Math.PI * 1.4]} />
          <meshStandardMaterial color="#c9d3da" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      <group ref={armR} position={[0.36, 1.05, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.75} />
        </mesh>
      </group>
      {/* Kopf */}
      <group ref={head} position={[0, 1.44, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.33, 16, 14]} />
          <meshStandardMaterial color={palette.skin} roughness={0.75} />
        </mesh>
        {/* Bandana */}
        <mesh position={[0, 0.07, 0]} scale={[1.04, 0.98, 1.04]}>
          <sphereGeometry args={[0.33, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={palette.bandana} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.3, 0.12, -0.16]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.07, 0.22, 6]} />
          <meshStandardMaterial color={palette.bandana} roughness={0.85} flatShading />
        </mesh>
        <Face skin={palette.skin} patch />
      </group>
    </>
  );
}

export default function Character3D({ theme = 'princess', mood = 'idle', floor = 0 }) {
  const palette = useMemo(() => paletteFor(theme), [theme]);

  const root = useRef();   // Plattform + Figur (Feder-Höhe)
  const body = useRef();   // Hüpfen / Drehen
  const head = useRef();
  const armL = useRef();
  const armR = useRef();

  const anim = useRef({
    y: floor * FLOOR_H,
    vy: 0,
    cheer: 0,
    sad: 0,
    spin: 0,
    prevFloor: floor,
  });

  // Beim Aufstieg: kräftiger Hüpfer
  useEffect(() => {
    const a = anim.current;
    if (floor > a.prevFloor) a.vy += 3.6;
    else if (floor < a.prevFloor) a.vy -= 2.2;
    a.prevFloor = floor;
  }, [floor]);

  useFrame(({ clock }, delta) => {
    const a = anim.current;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;

    // Feder Richtung Zieletage (mit Überschwinger)
    const target = floor * FLOOR_H;
    a.vy += (target - a.y) * 42 * dt;
    a.vy *= Math.exp(-8.5 * dt);
    a.y += a.vy * dt;

    // Stimmungen weich ein-/ausblenden
    a.cheer = damp(a.cheer, mood === 'cheer' ? 1 : 0, 7, dt);
    a.sad = damp(a.sad, mood === 'sad' ? 1 : 0, 6, dt);
    if (mood === 'cheer' && a.spin <= 0) a.spin = 0.9; // Sekunden

    if (root.current) {
      root.current.position.y = a.y;
    }
    if (body.current) {
      const bob = Math.sin(t * 2.3) * 0.045 * (1 - a.cheer);
      const cheerHop = a.cheer * Math.abs(Math.sin(t * 9)) * 0.22;
      body.current.position.y = bob + cheerHop - a.sad * 0.08;

      // Jubel-Drehung
      if (a.spin > 0) {
        a.spin = Math.max(0, a.spin - dt);
        const p = 1 - a.spin / 0.9;
        body.current.rotation.y = p * Math.PI * 2;
      } else {
        body.current.rotation.y = damp(
          body.current.rotation.y % (Math.PI * 2),
          0,
          10,
          dt
        );
      }
    }
    if (head.current) {
      head.current.rotation.x = damp(head.current.rotation.x, a.sad * 0.5, 8, dt);
      head.current.rotation.z = Math.sin(t * 1.7) * 0.05 * (1 - a.sad);
    }
    if (armL.current && armR.current) {
      const sway = Math.sin(t * 2.3) * 0.12;
      // idle: leichtes Schwingen | cheer: Arme hoch | sad: hängen lassen
      const up = a.cheer * 2.45;
      const droop = a.sad * -0.12;
      armL.current.rotation.z = damp(armL.current.rotation.z, 0.15 + sway + up + droop, 9, dt);
      armR.current.rotation.z = damp(armR.current.rotation.z, -0.15 + sway - up - droop, 9, dt);
      armL.current.rotation.x = armR.current.rotation.x = a.cheer * Math.sin(t * 9) * 0.3;
    }
  });

  const stand = standZ(theme);

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Plattform am Turm */}
      <group position={[0, -0.12, stand]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[1.0, 0.85, 0.22, 12]} />
          <meshStandardMaterial color={theme === 'pirate' ? palette.wood : palette.stoneDark} roughness={0.9} flatShading />
        </mesh>
        {/* Strebe zum Turm */}
        <mesh position={[0, -0.4, -0.5]} rotation={[0.7, 0, 0]}>
          <boxGeometry args={[0.18, 0.9, 0.18]} />
          <meshStandardMaterial color={theme === 'pirate' ? palette.woodDark : palette.mortar} roughness={0.95} />
        </mesh>
      </group>

      {/* Figur */}
      <group ref={body} position={[0, 0, stand]}>
        {theme === 'pirate' ? (
          <PirateBody palette={palette} armL={armL} armR={armR} head={head} />
        ) : (
          <PrincessBody palette={palette} armL={armL} armR={armR} head={head} />
        )}
      </group>
    </group>
  );
}
