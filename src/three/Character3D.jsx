import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H, paletteFor, standZ } from './world3d.js';
import { makeStripeTexture } from './textures.js';

/**
 * Die Spielfigur mit realistischen Proportionen (~7 Kopfhöhen, ~1,70 hoch):
 * Hals, Ohren, Nase, eingebettete Augen mit Iris und Lichtreflex, Arme mit
 * Ellenbogen und Händen, Beine mit Knien und Schuhen. Sie steht auf einer
 * Plattform am Turm/Mast, hüpft bei jeder richtigen Antwort eine Etage
 * höher, kraxelt beim Etagenwechsel und kennt die Stimmungen
 * idle / cheer / sad (Lächeln wird zur Trauer-Straße, dazu Blinzeln).
 */

const damp = THREE.MathUtils.damp;

/** Ein Auge: Lederhaut, Iris, Pupille, Lichtreflex – bleibt auch nachts lebendig. */
function Eye({ x, iris, refEye }) {
  return (
    <group ref={refEye} position={[x, 0.155, 0.129]}>
      <mesh scale={[1, 1, 0.85]} castShadow={false}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#f4f1e8" />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <sphereGeometry args={[0.017, 10, 10]} />
        <meshBasicMaterial color={iris} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshBasicMaterial color="#14100c" />
      </mesh>
      <mesh position={[0.01, 0.011, 0.037]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/**
 * Gesicht (ohne Kopfform): Augen, Brauen, Nase, Mund, Ohren.
 * patch = rechtes Auge unter Augenklappe; scowl = Pirate stirnrunzelt.
 */
function Face({
  skin,
  iris,
  lips,
  browColor,
  noseR = 0.02,
  mouthW = 0.03,
  scowl = 0,
  patch = false,
  eyeLRef,
  eyeRRef,
  mouthRef,
}) {
  return (
    <group>
      <Eye x={-0.058} iris={iris} refEye={eyeLRef} />
      {patch ? (
        <group position={[0.058, 0.155, 0.15]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.016, 16]} />
            <meshStandardMaterial color="#232f42" roughness={0.7} />
          </mesh>
        </group>
      ) : (
        <Eye x={0.058} iris={iris} refEye={eyeRRef} />
      )}
      {patch && (
        <mesh position={[0, 0.168, 0.012]} rotation={[Math.PI / 2, 0, 0.5, 'ZYX']}>
          <torusGeometry args={[0.168, 0.009, 6, 44]} />
          <meshStandardMaterial color="#232f42" roughness={0.75} />
        </mesh>
      )}
      {/* Brauen */}
      <mesh position={[-0.058, 0.203, 0.148]} rotation={[0, 0, -0.12 * scowl + 0.06]}>
        <boxGeometry args={[0.05, 0.013, 0.016]} />
        <meshStandardMaterial color={browColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.058, 0.203, 0.148]} rotation={[0, 0, 0.12 * scowl - 0.06]}>
        <boxGeometry args={[0.05, 0.013, 0.016]} />
        <meshStandardMaterial color={browColor} roughness={0.85} />
      </mesh>
      {/* Nase */}
      <mesh position={[0, 0.105, 0.145]} scale={[0.85, 1, 1.1]} castShadow>
        <sphereGeometry args={[noseR, 10, 10]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* Mund – useFrame kippt ihn zur Trauer-Straße */}
      <mesh ref={mouthRef} position={[0, 0.045, 0.12]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[mouthW, 0.009, 6, 14, Math.PI]} />
        <meshStandardMaterial color={lips} roughness={0.5} />
      </mesh>
      {/* Ohren */}
      <mesh position={[-0.145, 0.15, -0.01]} scale={[0.5, 1, 0.8]} castShadow>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0.145, 0.15, -0.01]} scale={[0.5, 1, 0.8]} castShadow>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Hüfte, Oberschenkel, Knie, Waden, Füße – Farben je nach Kostüm. */
function Legs({ thighColor, calfColor, footColor, legL, legR }) {
  const leg = (side) => (
    <group position={[side * 0.085, 0.86, 0]} ref={side < 0 ? legL : legR}>
      {/* Oberschenkel */}
      <mesh position={[0, -0.17, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 5, 10]} />
        <meshStandardMaterial color={thighColor} roughness={0.85} />
      </mesh>
      {/* Kniegelenk + Unterschenkel reichen bis zum Fußknöchel */}
      <group position={[0, -0.4, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color={calfColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.21, 0]} castShadow>
          <capsuleGeometry args={[0.05, 0.18, 5, 10]} />
          <meshStandardMaterial color={calfColor} roughness={0.85} />
        </mesh>
        {/* Fuß / Stiefel (Boden bei y = 0) */}
        <mesh position={[0, -0.4, 0.03]} castShadow>
          <boxGeometry args={[0.085, 0.1, 0.17]} />
          <meshStandardMaterial color={footColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.4, 0.07]} scale={[0.9, 0.9, 1]} castShadow>
          <sphereGeometry args={[0.048, 8, 8]} />
          <meshStandardMaterial color={footColor} roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
  return (
    <>
      {leg(-1)}
      {leg(1)}
    </>
  );
}

/** Die Prinzessin: Ballkleid (Lathe-Silhouette), Cape, Hochfrisur, Diadehm. */
function PrincessBody({ palette, armL, armR, head, cape, mouth, eyeL, eyeR, legL, legR }) {
  // Kleid-Silhouette: Taille → weiter Ausbüchtung → Saum
  const skirtPoints = useMemo(
    () => [
      new THREE.Vector2(0.15, 1.02),
      new THREE.Vector2(0.17, 0.97),
      new THREE.Vector2(0.19, 0.9),
      new THREE.Vector2(0.235, 0.76),
      new THREE.Vector2(0.29, 0.58),
      new THREE.Vector2(0.35, 0.38),
      new THREE.Vector2(0.4, 0.2),
      new THREE.Vector2(0.435, 0.07),
      new THREE.Vector2(0.445, 0.03),
    ],
    []
  );

  return (
    <>
      {/* Hals */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.047, 0.052, 0.1, 12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.7} />
      </mesh>
      {/* Mieder */}
      <mesh position={[0, 1.155, 0]} castShadow>
        <cylinderGeometry args={[0.175, 0.15, 0.31, 18]} />
        <meshStandardMaterial color={palette.dress} roughness={0.75} />
      </mesh>
      {/* Ballkleid */}
      <mesh castShadow>
        <latheGeometry args={[skirtPoints, 26]} />
        <meshStandardMaterial color={palette.dress} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Saum- und Taillengürtel in Gold */}
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.445, 0.02, 8, 40]} />
        <meshStandardMaterial color={palette.crown} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.157, 0.028, 8, 32]} />
        <meshStandardMaterial color={palette.crown} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.015, 0.16]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color={palette.cape} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Cape – ref weht beim Jubeln nach hinten */}
      <group ref={cape} position={[0, 1.28, -0.14]} rotation={[-0.06, 0, 0]}>
        <mesh position={[0, -0.36, -0.02]} scale={[1, 1, 0.5]} castShadow>
          <cylinderGeometry args={[0.15, 0.3, 0.72, 20, 1, true]} />
          <meshStandardMaterial
            color={palette.cape}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* Cape-Schnalle */}
      <mesh position={[-0.045, 1.295, 0.108]} castShadow>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshStandardMaterial color={palette.crown} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.045, 1.295, 0.108]} castShadow>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshStandardMaterial color={palette.crown} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Beine (unter dem Kleid) */}
      <Legs thighColor={palette.skin} calfColor={palette.skin} footColor={palette.crown} legL={legL} legR={legR} />
      {/* Arme: Schulter → Oberarm → Ellenbogen (leicht gebeugt) → Hand */}
      <group ref={armL} position={[-0.2, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.078, 12, 12]} />
          <meshStandardMaterial color={palette.dress} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.14, 4, 10]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.23, 0]} scale={[1, 1.1, 0.85]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0.03, -0.22, 0.015]} castShadow>
            <sphereGeometry args={[0.017, 8, 8]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
        </group>
      </group>
      <group ref={armR} position={[0.2, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.078, 12, 12]} />
          <meshStandardMaterial color={palette.dress} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.14, 4, 10]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.23, 0]} scale={[1, 1.1, 0.85]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          <mesh position={[-0.03, -0.22, 0.015]} castShadow>
            <sphereGeometry args={[0.017, 8, 8]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
        </group>
      </group>
      {/* Kopf: ovale Schädel Form, Hochfrisur, Diadehm, Gesicht */}
      <group ref={head} position={[0, 1.34, 0]}>
        <mesh position={[0, 0.16, 0.012]} scale={[1, 1.12, 1.05]} castShadow>
          <sphereGeometry args={[0.148, 24, 20]} />
          <meshStandardMaterial color={palette.skin} roughness={0.65} />
        </mesh>
        {/* Haar: Hinterkopf-Volumen, Dutt, Stirnlocken, Schläfenringe */}
        <mesh position={[0, 0.15, -0.045]} scale={[1.02, 1.05, 1.02]} castShadow>
          <sphereGeometry args={[0.152, 20, 18]} />
          <meshStandardMaterial color={palette.hair} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.24, -0.155]} castShadow>
          <sphereGeometry args={[0.066, 14, 14]} />
          <meshStandardMaterial color={palette.hair} roughness={0.45} />
        </mesh>
        {[-0.095, -0.05, 0, 0.05, 0.095].map((x) => (
          <mesh
            key={x}
            position={[x, 0.26 - Math.abs(x) * 0.3, 0.12 - Math.abs(x) * 0.18]}
            rotation={[0, 0, -x * 1.8]}
            scale={[1, 0.75, 0.55]}
            castShadow
          >
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={palette.hair} roughness={0.45} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.142, 0.13, 0.015]}
            scale={[0.4, 1.5, 0.55]}
            castShadow
          >
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={palette.hair} roughness={0.45} />
          </mesh>
        ))}
        <Face
          skin={palette.skin}
          iris={palette.iris}
          lips={palette.lips}
          browColor={palette.hair}
          noseR={0.018}
          mouthW={0.028}
          eyeLRef={eyeL}
          eyeRRef={eyeR}
          mouthRef={mouth}
        />
        {/* Diadehm mit Spitzen und Stein */}
        <mesh position={[0, 0.195, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.166, 0.013, 8, 36]} />
          <meshStandardMaterial color={palette.crown} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.225, 0.168]} castShadow>
          <coneGeometry args={[0.02, 0.06, 8]} />
          <meshStandardMaterial color={palette.crown} metalness={0.5} roughness={0.3} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.078, 0.22, 0.145]}
            rotation={[0, 0, -s * 0.25]}
            castShadow
          >
            <coneGeometry args={[0.016, 0.045, 8]} />
            <meshStandardMaterial color={palette.crown} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.195, 0.185]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color={palette.cape} metalness={0.3} roughness={0.25} />
        </mesh>
      </group>
    </>
  );
}

/** Der Pirat: Streifenhemd, offene Lederweste, Gürtel, Stiefel, Augenklappe. */
function PirateBody({ palette, armL, armR, head, mouth, eyeL, eyeR, legL, legR }) {
  const stripes = useMemo(
    () => makeStripeTexture(palette.shirt, palette.stripe, 6),
    [palette]
  );

  return (
    <>
      {/* Hals */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.1, 12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.7} />
      </mesh>
      {/* Matrosenhemd mit prozeduralen Streifen */}
      <mesh position={[0, 1.16, 0]} castShadow>
        <cylinderGeometry args={[0.185, 0.16, 0.32, 18]} />
        <meshStandardMaterial map={stripes} roughness={0.85} />
      </mesh>
      {/* Offene Lederweste (Vorderlücke zeigen das Hemd) */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry
          args={[0.196, 0.172, 0.34, 20, 1, true, 0.55, Math.PI * 2 - 1.1]}
        />
        <meshStandardMaterial
          color={palette.vest}
          roughness={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Kragen */}
      <mesh position={[0, 1.325, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.018, 8, 24]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.85} />
      </mesh>
      {/* Gürtel mit Gold-Schnalle */}
      <mesh position={[0, 0.99, 0]} castShadow>
        <cylinderGeometry args={[0.168, 0.168, 0.06, 18]} />
        <meshStandardMaterial color={palette.beltDark} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.99, 0.17]} castShadow>
        <boxGeometry args={[0.07, 0.055, 0.02]} />
        <meshStandardMaterial color={palette.gold} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Hüfte / Hosenbund */}
      <mesh position={[0, 0.945, 0]} scale={[1.05, 0.62, 0.9]} castShadow>
        <sphereGeometry args={[0.165, 16, 14]} />
        <meshStandardMaterial color={palette.pants} roughness={0.85} />
      </mesh>
      {/* Beine: Hose + Stiefel */}
      <Legs thighColor={palette.pants} calfColor={palette.boots} footColor={palette.beltDark} legL={legL} legR={legR} />
      {/* Arme: Schulter → Streifenärmel → Ellenbogen → Hand / Haken */}
      <group ref={armL} position={[-0.195, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.068, 12, 12]} />
          <meshStandardMaterial color={palette.shirt} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.046, 0.2, 14]} />
          <meshStandardMaterial map={stripes} roughness={0.85} />
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.23, 0]} scale={[1, 1.1, 0.85]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0.03, -0.22, 0.015]} castShadow>
            <sphereGeometry args={[0.017, 8, 8]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
        </group>
      </group>
      <group ref={armR} position={[0.195, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.068, 12, 12]} />
          <meshStandardMaterial color={palette.shirt} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.046, 0.2, 14]} />
          <meshStandardMaterial map={stripes} roughness={0.85} />
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            <meshStandardMaterial color={palette.skin} roughness={0.7} />
          </mesh>
          {/* Silberner Haken statt Hand */}
          <mesh position={[0, -0.26, 0]} castShadow>
            <cylinderGeometry args={[0.017, 0.017, 0.12, 10]} />
            <meshStandardMaterial color={palette.silver} metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0.042, -0.32, 0]} rotation={[0, 0, Math.PI]} castShadow>
            <torusGeometry args={[0.042, 0.014, 6, 16, Math.PI]} />
            <meshStandardMaterial color={palette.silver} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      </group>
      {/* Kopf: Bandana, Dutt, Kinnbart, Augenklappe */}
      <group ref={head} position={[0, 1.34, 0]}>
        <mesh position={[0, 0.16, 0.012]} scale={[1, 1.12, 1.05]} castShadow>
          <sphereGeometry args={[0.148, 24, 20]} />
          <meshStandardMaterial color={palette.skin} roughness={0.65} />
        </mesh>
        {/* Kinnbart */}
        <mesh position={[0, 0.008, 0.055]} scale={[0.85, 0.5, 0.6]} castShadow>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color={palette.hair} roughness={0.7} />
        </mesh>
        {/* Dutt im Nacken */}
        <mesh position={[0, 0.05, -0.15]} rotation={[0.55, 0, 0]} castShadow>
          <capsuleGeometry args={[0.045, 0.1, 5, 10]} />
          <meshStandardMaterial color={palette.hair} roughness={0.55} />
        </mesh>
        {/* Bandana-Kuppel + gewickeltes Stirnband */}
        <mesh position={[0, 0.258, 0.005]} scale={[1, 0.45, 1.02]} castShadow>
          <sphereGeometry args={[0.172, 20, 16]} />
          <meshStandardMaterial color={palette.bandana} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.235, 0.005]} castShadow>
          <cylinderGeometry args={[0.156, 0.16, 0.055, 20, 1, true]} />
          <meshStandardMaterial
            color={palette.bandana}
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Knoten mit zwei Zipfeln */}
        <mesh position={[0.14, 0.23, -0.08]} castShadow>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial color={palette.bandana} roughness={0.8} />
        </mesh>
        <mesh position={[0.15, 0.155, -0.105]} rotation={[0.35, 0, -0.5]} castShadow>
          <capsuleGeometry args={[0.016, 0.1, 4, 8]} />
          <meshStandardMaterial color={palette.bandana} roughness={0.8} />
        </mesh>
        <mesh position={[0.12, 0.145, -0.13]} rotation={[0.5, 0, -0.75]} castShadow>
          <capsuleGeometry args={[0.016, 0.1, 4, 8]} />
          <meshStandardMaterial color={palette.bandana} roughness={0.8} />
        </mesh>
        <Face
          skin={palette.skin}
          iris={palette.iris}
          lips={palette.lips}
          browColor={palette.hair}
          noseR={0.023}
          mouthW={0.034}
          scowl={1}
          patch
          eyeLRef={eyeL}
          eyeRRef={eyeR}
          mouthRef={mouth}
        />
        {/* Goldener Ohrring */}
        <mesh position={[-0.152, 0.1, 0]}>
          <torusGeometry args={[0.025, 0.008, 8, 20]} />
          <meshStandardMaterial color={palette.gold} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </>
  );
}
/**
 * Anschlagpunkt: root (Federhöhe je Etage) → body (Hüpfen, Drehen) →
 * Körperteile. Die Deko-Bewegungen (Sway, Kopfblick) respektieren
 * prefers-reduced-motion, die Spielbewegungen (Hüpfer, Stimmung) nicht.
 */
export default function Character3D({ floor = 0, theme = 'princess', mood = 'idle' }) {
  const palette = useMemo(() => paletteFor(theme), [theme]);
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const root = useRef();   // Feder zur Ziel-Etage
  const body = useRef();   // Hüpfen / Drehen
  const head = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();
  const cape = useRef();
  const mouth = useRef();
  const eyeL = useRef();
  const eyeR = useRef();

  const anim = useRef({
    y: floor * FLOOR_H,
    vy: 0,
    cheer: 0,
    sad: 0,
    spin: 0,
    prevFloor: floor,
  });

  // Beim Aufstieg: kräftiger Hüpf-Anstoß
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
    const rm = reduced ? 0 : 1; // dekorative Bewegung aus bei Reduced Motion

    // Feder Richtung Ziel-Etage (mit Überschwinger)
    const target = floor * FLOOR_H;
    a.vy += (target - a.y) * 42 * dt;
    a.vy *= Math.exp(-8.5 * dt);
    a.y += a.vy * dt;

    // Stimmungen weich ein-/ausblenden
    a.cheer = damp(a.cheer, mood === 'cheer' ? 1 : 0, 7, dt);
    a.sad = damp(a.sad, mood === 'sad' ? 1 : 0, 6, dt);
    if (mood === 'cheer' && a.spin <= 0) a.spin = 0.9; // Sekunden

    const climb = Math.min(1, Math.abs(a.vy) * 0.16); // Griff-Wechsel beim Etagenwechsel
    const step = Math.sin(t * 13) * 0.6 * climb;
    const sway = Math.sin(t * 2.1) * 0.09 * rm * (1 - a.cheer);
    const wave = a.cheer * Math.sin(t * 10) * 0.35;

    if (root.current) {
      root.current.position.y = a.y;
    }
    if (body.current) {
      const bob = Math.sin(t * 2.2) * 0.035 * rm * (1 - a.cheer);
      const cheerHop = a.cheer * Math.abs(Math.sin(t * 9)) * 0.2;
      body.current.position.y = bob + cheerHop - a.sad * 0.07;
      body.current.rotation.z =
        Math.sin(t * 0.9) * 0.02 * rm * (1 - a.sad) - a.sad * 0.05;

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
      head.current.rotation.y = Math.sin(t * 0.55) * 0.1 * rm * (1 - a.sad);
      head.current.rotation.z =
        Math.sin(t * 1.7) * 0.04 * rm * (1 - a.sad) + a.sad * 0.08;
    }

    // Mund: Lächeln wird zur Trauer-Straße
    if (mouth.current) {
      mouth.current.rotation.z = damp(
        mouth.current.rotation.z,
        a.sad > 0.4 ? 0 : Math.PI,
        9,
        dt
      );
    }

    // Blinzeln (unter der Augenklappe existiert das rechte Auge nicht)
    const cyc = t % 3.8;
    const blink = cyc > 3.62 ? 1 - 0.9 * Math.sin(((cyc - 3.62) / 0.18) * Math.PI) : 1;
    if (eyeL.current) eyeL.current.scale.y = blink;
    if (eyeR.current) eyeR.current.scale.y = blink;
    // Arme: hängen natürlich, heben beim Jubeln, schwungvoll beim Klettern
    if (armL.current && armR.current) {
      const up = a.cheer;
      armL.current.rotation.z = damp(
        armL.current.rotation.z,
        -0.1 - up * 2.45 - sway + up * wave + a.sad * 0.04,
        9,
        dt
      );
      armR.current.rotation.z = damp(
        armR.current.rotation.z,
        0.1 + up * 2.45 + sway + up * wave - a.sad * 0.04,
        9,
        dt
      );
      armL.current.rotation.x = damp(
        armL.current.rotation.x,
        -0.06 - a.sad * 0.25 + step + up * 0.15,
        9,
        dt
      );
      armR.current.rotation.x = damp(
        armR.current.rotation.x,
        -0.06 - a.sad * 0.25 - step + up * 0.15,
        9,
        dt
      );
    }

    // Beine: Kletter-Schritt + beim Jubeln angezogen
    if (legL.current && legR.current) {
      const tuck = a.cheer * Math.abs(Math.sin(t * 9)) * 0.5;
      legL.current.rotation.x = damp(legL.current.rotation.x, step - tuck, 10, dt);
      legR.current.rotation.x = damp(legR.current.rotation.x, -step - tuck, 10, dt);
    }

    // Cape weht beim Jubeln nach hinten
    if (cape.current) {
      cape.current.rotation.x = damp(
        cape.current.rotation.x,
        -0.06 + Math.sin(t * 1.9) * 0.05 * rm + a.cheer * 0.35 - a.sad * 0.05,
        6,
        dt
      );
    }
  });

  const stand = standZ(theme);

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Plattform am Turm */}
      <group position={[0, -0.12, stand]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[1.0, 0.85, 0.22, 12]} />
          <meshStandardMaterial
            color={theme === 'pirate' ? palette.wood : palette.stoneDark}
            roughness={0.9}
            flatShading
          />
        </mesh>
        {/* Strebe zum Turm */}
        <mesh position={[0, -0.4, -0.5]} rotation={[0.7, 0, 0]}>
          <boxGeometry args={[0.18, 0.9, 0.18]} />
          <meshStandardMaterial
            color={theme === 'pirate' ? palette.woodDark : palette.mortar}
            roughness={0.95}
          />
        </mesh>
      </group>

      {/* Figur */}
      <group ref={body} position={[0, 0, stand]}>
        {theme === 'pirate' ? (
          <PirateBody
            palette={palette}
            armL={armL}
            armR={armR}
            head={head}
            mouth={mouth}
            eyeL={eyeL}
            eyeR={eyeR}
            legL={legL}
            legR={legR}
          />
        ) : (
          <PrincessBody
            palette={palette}
            armL={armL}
            armR={armR}
            head={head}
            cape={cape}
            mouth={mouth}
            eyeL={eyeL}
            eyeR={eyeR}
            legL={legL}
            legR={legR}
          />
        )}
      </group>
    </group>
  );
}
