import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H, paletteFor, standZ } from './world3d.js';
import { makeHeadGeometry } from './headSculpt.js';
import {
  makeHeadTexture,
  makeIrisTexture,
  makeLidTexture,
  makeSkinTexture,
  makeHairTexture,
  makeDressTexture,
  makeShirtTexture,
  makeLeatherTexture,
  makeClothTexture,
  makeLipTexture,
} from './characterTextures.js';

/**
 * Die Spielfigur als personalisierte Person: Kopf aus der Vertex-Skulptur
 * (echte Augenhöhlen, Stirnbein, Jochbeine, Kieferlinie), Glasaugen mit
 * Iris-Map und Blinzel-Lidern, geometrische Nase/Lippen/Brauen, gemalte
 * Haut-Maps (Sommersprossen / Narbe) und Stoff-/Leder-Maps am Kostüm.
 * Kein Drehen mehr – das Gesicht bleibt zur Kamera.
 *
 * Alle Gesichts-Koordinaten sind KOPF-LOKAL: die Face-Gruppe sitzt bei
 * y=0.16 innerhalb der Kopf-Gruppe, die selbst bei y=1.34 steht.
 */

const damp = THREE.MathUtils.damp;

function Face({ palette, pirate, tex, refs }) {
  const {
    lidUL, lidUR, lidLL, lidLR,
    browL, browR, mouthLine, eyeL, eyeR,
  } = refs;
  const skin = <meshStandardMaterial map={tex.skin} roughness={0.6} />;

  return (
    <group position={[0, 0.16, 0]}>
      {/* Geschulptter Schädel mit Haut- und Haar-Map */}
      <mesh castShadow receiveShadow>
        <primitive object={tex.headGeo} attach="geometry" />
        <meshStandardMaterial map={tex.head} roughness={0.55} />
      </mesh>

      {/* --- Nase: echtes Volumen, Piratin mit schiefer Brücke --- */}
      {pirate ? (
        <>
          <mesh position={[0.004, 0.018, 0.153]} rotation={[-0.3, 0, 0.14]} scale={[0.85, 1, 1]} castShadow>
            <capsuleGeometry args={[0.016, 0.08, 4, 10]} />
            {skin}
          </mesh>
          <mesh position={[0.014, -0.05, 0.17]} scale={[1, 0.85, 1.1]} castShadow>
            <sphereGeometry args={[0.024, 14, 14]} />
            {skin}
          </mesh>
          <mesh position={[-0.012, -0.057, 0.152]} scale={[1, 0.8, 0.9]} castShadow>
            <sphereGeometry args={[0.013, 10, 10]} />
            {skin}
          </mesh>
          <mesh position={[0.04, -0.057, 0.15]} scale={[1, 0.8, 0.9]} castShadow>
            <sphereGeometry args={[0.013, 10, 10]} />
            {skin}
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.02, 0.152]} rotation={[-0.28, 0, 0]} scale={[0.8, 1, 1]} castShadow>
            <capsuleGeometry args={[0.014, 0.08, 4, 10]} />
            {skin}
          </mesh>
          <mesh position={[0, -0.052, 0.166]} scale={[1, 0.88, 1.05]} castShadow>
            <sphereGeometry args={[0.02, 14, 14]} />
            {skin}
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.023, -0.058, 0.15]} scale={[1, 0.8, 0.9]} castShadow>
              <sphereGeometry args={[0.012, 10, 10]} />
              {skin}
            </mesh>
          ))}
        </>
      )}
      {/* --- Lippen: Volumen + Stimmungs-Mundlinie --- */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.013, -0.096, 0.13]} scale={[1, 0.6, 0.55]} castShadow>
          <sphereGeometry args={[0.015, 12, 10]} />
          <meshStandardMaterial map={tex.lip} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, -0.119, 0.122]} scale={[1.15, 0.55, 0.6]} castShadow>
        <sphereGeometry args={[0.027, 14, 12]} />
        <meshStandardMaterial map={tex.lip} roughness={0.35} />
      </mesh>
      <mesh ref={mouthLine} position={[0, -0.107, 0.12]} rotation={[0, 0, Math.PI]} scale={[1, 0.6, 1]}>
        <torusGeometry args={[0.03, 0.0035, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#4a2a28" roughness={0.5} />
      </mesh>

      {/* --- Glasaugen mit Iris-Map, Lider zum Blinzeln --- */}
      {pirate ? (
        <>
          <group position={[-0.056, -0.01, 0.105]}>
            <group ref={eyeL}>
              <mesh>
                <sphereGeometry args={[0.036, 24, 20]} />
                <meshStandardMaterial map={tex.iris} roughness={0.15} />
              </mesh>
            </group>
            <mesh ref={lidUL}>
              <sphereGeometry args={[0.039, 20, 12, 0, Math.PI * 2, 0, 1.4]} />
              <meshStandardMaterial map={tex.lid} side={THREE.DoubleSide} roughness={0.65} />
            </mesh>
            <mesh ref={lidLL}>
              <sphereGeometry args={[0.039, 20, 12, 0, Math.PI * 2, 1.746, Math.PI - 1.746]} />
              <meshStandardMaterial map={tex.lid} side={THREE.DoubleSide} roughness={0.65} />
            </mesh>
          </group>
          <mesh position={[0.056, -0.01, 0.134]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.046, 0.046, 0.014, 18]} />
            <meshStandardMaterial color="#232f42" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0.5, 'ZYX']}>
            <torusGeometry args={[0.15, 0.009, 6, 44]} />
            <meshStandardMaterial color="#232f42" roughness={0.75} />
          </mesh>
        </>
      ) : (
        [-1, 1].map((s) => (
          <group key={s} position={[s * 0.056, -0.01, 0.105]}>
            <group ref={s < 0 ? eyeL : eyeR}>
              <mesh>
                <sphereGeometry args={[0.036, 24, 20]} />
                <meshStandardMaterial map={tex.iris} roughness={0.15} />
              </mesh>
            </group>
            <mesh ref={s < 0 ? lidUL : lidUR}>
              <sphereGeometry args={[0.039, 20, 12, 0, Math.PI * 2, 0, 1.4]} />
              <meshStandardMaterial map={tex.lid} side={THREE.DoubleSide} roughness={0.65} />
            </mesh>
            <mesh ref={s < 0 ? lidLL : lidLR}>
              <sphereGeometry args={[0.039, 20, 12, 0, Math.PI * 2, 1.746, Math.PI - 1.746]} />
              <meshStandardMaterial map={tex.lid} side={THREE.DoubleSide} roughness={0.65} />
            </mesh>
          </group>
        ))
      )}

      {/* --- Brauen: Stimmung kippt sie über die Gruppen-Refs --- */}
      <group ref={browL} position={[-0.056, 0.03, 0.14]}>
        <mesh rotation={[0, 0, pirate ? -0.06 : 0.1]} scale={[1, 0.35, 1]}>
          <torusGeometry args={[0.05, pirate ? 0.01 : 0.008, 6, 18, Math.PI]} />
          <meshStandardMaterial color={palette.hair} roughness={0.85} />
        </mesh>
      </group>
      <group ref={browR} position={[0.056, 0.03, 0.14]}>
        <mesh rotation={[0, 0, pirate ? 0.06 : -0.1]} scale={[1, 0.35, 1]}>
          <torusGeometry args={[0.05, pirate ? 0.01 : 0.008, 6, 18, Math.PI]} />
          <meshStandardMaterial color={palette.hair} roughness={0.85} />
        </mesh>
      </group>

      {/* --- Ohren: Muschel-Andeutung + Läppchen --- */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh
            position={[s * 0.145, -0.005, 0.005]}
            rotation={[0, (s * Math.PI) / 2, 0]}
            scale={[1, 1.15, 1]}
            castShadow
          >
            <torusGeometry args={[0.033, 0.011, 8, 20]} />
            <meshStandardMaterial map={tex.skin} roughness={0.65} />
          </mesh>
          <mesh position={[s * 0.142, -0.04, 0.012]} castShadow>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial map={tex.skin} roughness={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Hüfte, Oberschenkel, Knie, Unterschenkel, Füße – Farben je nach Kostüm. */
function Legs({ thighColor, calfColor, footColor, tex, legL, legR }) {
  const boot = <meshStandardMaterial color={footColor} map={tex.leather} roughness={0.65} />;
  const leg = (side) => (
    <group position={[side * 0.085, 0.86, 0]} ref={side < 0 ? legL : legR}>
      <mesh position={[0, -0.17, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 5, 10]} />
        <meshStandardMaterial map={tex.pants} roughness={0.9} />
      </mesh>
      <group position={[0, -0.4, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color={thighColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.21, 0]} castShadow>
          <capsuleGeometry args={[0.05, 0.18, 5, 10]} />
          <meshStandardMaterial color={calfColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.4, 0.03]} castShadow>
          <boxGeometry args={[0.085, 0.1, 0.17]} />
          {boot}
        </mesh>
        <mesh position={[0, -0.4, 0.07]} scale={[0.9, 0.9, 1]} castShadow>
          <sphereGeometry args={[0.048, 8, 8]} />
          {boot}
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

/** Jungkönigin: Ballkleid, Cape, Diadehm, Hochsteckfrisur, Sommersprossen. */
function PrincessBody({ palette, tex, refs }) {
  const { armL, armR, head, cape, legL, legR } = refs;

  // Kleid-Silhouette: Taille → glockiger Fall → Saum
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

  const dress = <meshStandardMaterial map={tex.dress} roughness={0.7} />;
  const gold = <meshStandardMaterial color={palette.crown} metalness={0.45} roughness={0.35} />;
  const skin = <meshStandardMaterial map={tex.skin} roughness={0.65} />;

  return (
    <>
      {/* Hals */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.047, 0.052, 0.1, 12]} />
        {skin}
      </mesh>
      {/* Mieder */}
      <mesh position={[0, 1.155, 0]} castShadow>
        <cylinderGeometry args={[0.175, 0.15, 0.31, 18]} />
        {dress}
      </mesh>
      {/* Ballkleid mit Falten-Map */}
      <mesh castShadow>
        <latheGeometry args={[skirtPoints, 26]} />
        {dress}
      </mesh>
      {/* Saum- und Taillengürtel in Gold */}
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.445, 0.02, 8, 40]} />
        {gold}
      </mesh>
      <mesh position={[0, 1.015, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.157, 0.028, 8, 32]} />
        {gold}
      </mesh>
      <mesh position={[0, 1.015, 0.16]} castShadow>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color={palette.cape} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Cape – weht beim Jubeln nach hinten */}
      <group ref={cape} position={[0, 1.28, -0.14]} rotation={[-0.06, 0, 0]}>
        <mesh position={[0, -0.36, -0.02]} scale={[1, 1, 0.5]} castShadow>
          <cylinderGeometry args={[0.15, 0.3, 0.72, 20, 1, true]} />
          <meshStandardMaterial map={tex.clothCape} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Cape-Schnalle */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.045, 1.295, 0.108]} castShadow>
          <sphereGeometry args={[0.026, 8, 8]} />
          {gold}
        </mesh>
      ))}
      {/* Beine (unter dem Kleid) */}
      <Legs
        thighColor={palette.skin}
        calfColor={palette.skin}
        footColor={palette.crown}
        tex={tex}
        legL={legL}
        legR={legR}
      />
      {/* Arme: Schulter → Oberarm → Ellenbogen (leicht gebeugt) → Hand */}
      <group ref={armL} position={[-0.2, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.078, 12, 12]} />
          {dress}
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.14, 4, 10]} />
          {skin}
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            {skin}
          </mesh>
          <mesh position={[0, -0.23, 0]} scale={[1, 1.1, 0.85]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            {skin}
          </mesh>
          <mesh position={[0.03, -0.22, 0.015]} castShadow>
            <sphereGeometry args={[0.017, 8, 8]} />
            {skin}
          </mesh>
        </group>
      </group>
      <group ref={armR} position={[0.2, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.078, 12, 12]} />
          {dress}
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.14, 4, 10]} />
          {skin}
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            {skin}
          </mesh>
          <mesh position={[0, -0.23, 0]} scale={[1, 1.1, 0.85]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            {skin}
          </mesh>
          <mesh position={[-0.03, -0.22, 0.015]} castShadow>
            <sphereGeometry args={[0.017, 8, 8]} />
            {skin}
          </mesh>
        </group>
      </group>
      {/* Kopf: geschnitztes Gesicht + Hochsteckfrisur + Diadehm */}
      <group ref={head} position={[0, 1.34, 0]}>
        <Face palette={palette} pirate={false} tex={tex} refs={refs} />
        {/* Hochsteck-Dutt (Kopf-Mitte liegt bei y=0.16) */}
        <mesh position={[0, 0.365, -0.1]} castShadow>
          <sphereGeometry args={[0.065, 16, 14]} />
          <meshStandardMaterial map={tex.hair} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.325, -0.062]} rotation={[0.8, 0, 0]} castShadow>
          <torusGeometry args={[0.066, 0.014, 8, 24]} />
          <meshStandardMaterial map={tex.hair} roughness={0.5} />
        </mesh>
        {/* Locken an den Schläfen */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.118, 0.215, 0.062]}
            rotation={[0.1, 0, s * 0.32]}
            castShadow
          >
            <capsuleGeometry args={[0.011, 0.055, 4, 8]} />
            <meshStandardMaterial map={tex.hair} roughness={0.5} />
          </mesh>
        ))}
        {/* Diadehm: Reif + Steine + zwei Spitzen */}
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.14, 0.011, 8, 36]} />
          {gold}
        </mesh>
        <mesh position={[0, 0.25, 0.142]} castShadow>
          <sphereGeometry args={[0.013, 10, 10]} />
          <meshStandardMaterial color={palette.cape} metalness={0.3} roughness={0.25} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.05, 0.25, 0.131]} castShadow>
            <sphereGeometry args={[0.011, 8, 8]} />
            {gold}
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.09, 0.268, 0.105]} rotation={[0, 0, -s * 0.28]} castShadow>
            <coneGeometry args={[0.014, 0.042, 8]} />
            {gold}
          </mesh>
        ))}
      </group>
    </>
  );
}
/** Piratin: Streifenhemd, Lederweste, Bandana, Narbe, Augenklappe, Haken. */
function PirateBody({ palette, tex, refs }) {
  const { armL, armR, head, legL, legR } = refs;

  const shirt = <meshStandardMaterial map={tex.shirt} roughness={0.85} />;
  const skin = <meshStandardMaterial map={tex.skin} roughness={0.65} />;
  const vest = null;
  const belt = <meshStandardMaterial color={palette.beltDark} map={tex.leather} roughness={0.55} />;
  const gold = <meshStandardMaterial color={palette.gold} metalness={0.5} roughness={0.35} />;

  return (
    <>
      {/* Hals */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.1, 12]} />
        {skin}
      </mesh>
      {/* Matrosenhemd mit Falten-Map */}
      <mesh position={[0, 1.16, 0]} castShadow>
        <cylinderGeometry args={[0.185, 0.16, 0.32, 18]} />
        {shirt}
      </mesh>
      {/* Offene Lederweste (Vorderlücke zeigt das Hemd) */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.196, 0.172, 0.34, 20, 1, true, 0.55, Math.PI * 2 - 1.1]} />
        <meshStandardMaterial color={palette.vest} map={tex.leather} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Kragen */}
      <mesh position={[0, 1.325, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.065, 0.018, 8, 24]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.85} />
      </mesh>
      {/* Gürtel mit Gold-Schnalle */}
      <mesh position={[0, 0.99, 0]} castShadow>
        <cylinderGeometry args={[0.168, 0.168, 0.06, 18]} />
        {belt}
      </mesh>
      <mesh position={[0, 0.99, 0.17]} castShadow>
        <boxGeometry args={[0.07, 0.055, 0.02]} />
        {gold}
      </mesh>
      {/* Hüfte / Hosenbund */}
      <mesh position={[0, 0.945, 0]} scale={[1.05, 0.62, 0.9]} castShadow>
        <sphereGeometry args={[0.165, 16, 14]} />
        <meshStandardMaterial map={tex.pants} roughness={0.85} />
      </mesh>
      {/* Beine: Hose + Stiefel */}
      <Legs
        thighColor={palette.pants}
        calfColor={palette.boots}
        footColor={palette.beltDark}
        tex={tex}
        legL={legL}
        legR={legR}
      />
      {/* Arme: Schulter → Streifenärmel → Ellenbogen → Hand / Haken */}
      <group ref={armL} position={[-0.195, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.068, 12, 12]} />
          {shirt}
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.046, 0.2, 14]} />
          {shirt}
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            {skin}
          </mesh>
          <mesh position={[0, -0.23, 0]} scale={[1, 1.1, 0.85]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            {skin}
          </mesh>
          <mesh position={[0.03, -0.22, 0.015]} castShadow>
            <sphereGeometry args={[0.017, 8, 8]} />
            {skin}
          </mesh>
        </group>
      </group>
      <group ref={armR} position={[0.195, 1.27, 0]}>
        <mesh position={[0, -0.01, 0]} castShadow>
          <sphereGeometry args={[0.068, 12, 12]} />
          {shirt}
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.046, 0.2, 14]} />
          {shirt}
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, -0.11, 0]} castShadow>
            <capsuleGeometry args={[0.037, 0.13, 4, 10]} />
            {skin}
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
      {/* Kopf: geschnitztes Gesicht + gemusterte Bandana + Narbe (in der Map) */}
      <group ref={head} position={[0, 1.34, 0]}>
        <Face palette={palette} pirate tex={tex} refs={refs} />
        {/* Bandana-Kuppel (Kopf-Mitte bei y=0.16) */}
        <mesh position={[0, 0.275, 0.01]} scale={[1, 0.6, 1.02]} castShadow>
          <sphereGeometry args={[0.165, 20, 16]} />
          <meshStandardMaterial map={tex.bandana} roughness={0.8} />
        </mesh>
        {/* Stirnband, folgt der Kuppel-Neigung */}
        <mesh position={[0, 0.245, 0.01]} castShadow>
          <cylinderGeometry args={[0.176, 0.142, 0.062, 20, 1, true]} />
          <meshStandardMaterial map={tex.bandana} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Knoten mit zwei Zipfeln */}
        <mesh position={[0.15, 0.245, -0.05]} castShadow>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial map={tex.bandana} roughness={0.8} />
        </mesh>
        <mesh position={[0.16, 0.18, -0.07]} rotation={[0.3, 0, -0.45]} castShadow>
          <capsuleGeometry args={[0.015, 0.09, 4, 8]} />
          <meshStandardMaterial map={tex.bandana} roughness={0.8} />
        </mesh>
        <mesh position={[0.13, 0.17, -0.11]} rotation={[0.45, 0, -0.7]} castShadow>
          <capsuleGeometry args={[0.015, 0.09, 4, 8]} />
          <meshStandardMaterial map={tex.bandana} roughness={0.8} />
        </mesh>
        {/* Zerzauste Strähnen unter dem Band */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.128, 0.185, 0.03]} rotation={[0, 0, -s * 0.55]} castShadow>
            <capsuleGeometry args={[0.014, 0.05, 4, 8]} />
            <meshStandardMaterial map={tex.hair} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.14, -0.145]} rotation={[0.55, 0, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.05, 5, 10]} />
          <meshStandardMaterial map={tex.hair} roughness={0.5} />
        </mesh>
        {/* Goldener Ohrring */}
        <mesh position={[-0.15, 0.085, 0.005]} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.025, 0.008, 8, 20]} />
          {gold}
        </mesh>
      </group>
    </>
  );
}

/**
 * Anschlagpunkt: root (Federhöhe je Etage) → body (Hüpfen) → Figur.
 * Deko-Bewegungen respektieren prefers-reduced-motion, Spielbewegungen nicht.
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

  // Alle Maps einmalig pro Welt bauen (Canvas → GPU)
  const tex = useMemo(() => {
    const p = palette;
    if (theme === 'pirate') {
      return {
        // kräftigerer, etwas längerer Schädel
        headGeo: makeHeadGeometry({
          sx: 1.0, sy: 1.16, sz: 1.08, jaw: 0.36,
          chinAmp: 0.028, browAmp: 0.011, cheekAmp: 0.013, socketAmp: 0.021,
        }),
        head: makeHeadTexture({
          skin: p.skin, hair: p.hair, scar: true, scarColor: p.scar,
          blush: 0.07, hairA: 305, hairB: -75, seed: 19,
        }),
        iris: makeIrisTexture(p.iris),
        lid: makeLidTexture(p.skin),
        skin: makeSkinTexture(p.skin, 1),
        lip: makeLipTexture(p.lips),
        hair: makeHairTexture(p.hair, '#6a4a30'),
        shirt: makeShirtTexture(p.shirt, p.stripe),
        leather: makeLeatherTexture(p.vest),
        bandana: makeClothTexture(p.bandana, { dots: true }),
        pants: makeClothTexture(p.pants),
      };
    }
    return {
      // feiner Schädel
      headGeo: makeHeadGeometry({
        sx: 0.94, sy: 1.13, sz: 1.04, jaw: 0.44,
        chinAmp: 0.021, browAmp: 0.006, cheekAmp: 0.012, socketAmp: 0.019,
      }),
      head: makeHeadTexture({
        skin: p.skin, hair: p.hair, freckles: 110, freckle: p.freckle,
        hairHi: '#c98048', blush: 0.14, seed: 7,
      }),
      iris: makeIrisTexture(p.iris),
      lid: makeLidTexture(p.skin),
      skin: makeSkinTexture(p.skin, 0),
      lip: makeLipTexture(p.lips),
      hair: makeHairTexture(p.hair, '#c98048'),
      dress: makeDressTexture(p.dress, p.crown),
      leather: makeLeatherTexture('#c9a15f'),
      clothCape: makeClothTexture(p.cape),
      pants: makeSkinTexture(p.skin, 0),
    };
  }, [theme, palette]);
  const root = useRef();
  const body = useRef();
  const head = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();
  const cape = useRef();
  const mouthLine = useRef();
  const browL = useRef();
  const browR = useRef();
  const lidUL = useRef();
  const lidUR = useRef();
  const lidLL = useRef();
  const lidLR = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const refs = {
    armL, armR, head, cape, legL, legR,
    mouthLine, browL, browR, lidUL, lidUR, lidLL, lidLR, eyeL, eyeR,
  };

  const anim = useRef({ y: floor * FLOOR_H, vy: 0, cheer: 0, sad: 0, prevFloor: floor });

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
    const rm = reduced ? 0 : 1;

    // Feder Richtung Ziel-Etage (mit Überschwinger)
    const target = floor * FLOOR_H;
    a.vy += (target - a.y) * 42 * dt;
    a.vy *= Math.exp(-8.5 * dt);
    a.y += a.vy * dt;

    // Stimmungen weich ein-/ausblenden
    a.cheer = damp(a.cheer, mood === 'cheer' ? 1 : 0, 7, dt);
    a.sad = damp(a.sad, mood === 'sad' ? 1 : 0, 6, dt);

    const climb = Math.min(1, Math.abs(a.vy) * 0.16);
    const step = Math.sin(t * 13) * 0.6 * climb;
    const sway = Math.sin(t * 2.1) * 0.08 * rm * (1 - a.cheer);
    const wave = a.cheer * Math.sin(t * 10) * 0.35;

    if (root.current) root.current.position.y = a.y;

    if (body.current) {
      const bob = Math.sin(t * 2.2) * 0.03 * rm * (1 - a.cheer);
      const cheerHop = a.cheer * Math.abs(Math.sin(t * 9)) * 0.18;
      body.current.position.y = bob + cheerHop - a.sad * 0.06;
      // sanftes Wiegen, kein Drehen – das Gesicht bleibt zur Kamera
      body.current.rotation.z =
        Math.sin(t * 0.9) * 0.018 * rm * (1 - a.sad) - a.sad * 0.04;
      body.current.rotation.x = damp(body.current.rotation.x, a.sad * 0.05, 6, dt);
    }

    if (head.current) {
      head.current.rotation.x = damp(head.current.rotation.x, a.sad * 0.42, 8, dt);
      head.current.rotation.y = Math.sin(t * 0.55) * 0.05 * rm * (1 - a.sad);
      head.current.rotation.z =
        Math.sin(t * 1.7) * 0.035 * rm * (1 - a.sad) + a.sad * 0.07;
    }

    // Blinzeln: die Lider schließen über die Glasaugen
    const cyc = t % 3.8;
    const close = cyc > 3.62 ? Math.sin(((cyc - 3.62) / 0.18) * Math.PI) : 0;
    const up = close * 0.55;
    const lo = -close * 0.1;
    [lidUL, lidUR].forEach((r) => {
      if (r.current) r.current.rotation.x = damp(r.current.rotation.x, up, 30, dt);
    });
    [lidLL, lidLR].forEach((r) => {
      if (r.current) r.current.rotation.x = damp(r.current.rotation.x, lo, 30, dt);
    });

    // ruhiger Blick
    [eyeL, eyeR].forEach((r) => {
      if (r.current) {
        r.current.rotation.y = Math.sin(t * 0.6) * 0.05 * rm;
        r.current.rotation.x = Math.sin(t * 0.9 + 1.2) * 0.03 * rm;
      }
    });

    // Mund: Lächeln wird zur Trauer-Straße
    if (mouthLine.current) {
      mouthLine.current.rotation.z = damp(
        mouthLine.current.rotation.z,
        a.sad > 0.4 ? 0 : Math.PI,
        9,
        dt
      );
    }

    // Brauen: traurig nach innen hoch, jubelnd angehoben
    if (browL.current) {
      browL.current.rotation.z = damp(browL.current.rotation.z, a.sad * 0.28, 8, dt);
      browL.current.position.y = damp(
        browL.current.position.y,
        0.03 + a.cheer * 0.012,
        8,
        dt
      );
    }
    if (browR.current) {
      browR.current.rotation.z = damp(browR.current.rotation.z, -a.sad * 0.28, 8, dt);
      browR.current.position.y = damp(
        browR.current.position.y,
        0.03 + a.cheer * 0.012,
        8,
        dt
      );
    }
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
  const pirate = theme === 'pirate';

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Plattform am Turm */}
      <group position={[0, -0.12, stand]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[1.0, 0.85, 0.22, 12]} />
          <meshStandardMaterial
            color={pirate ? palette.wood : palette.stoneDark}
            roughness={0.9}
            flatShading
          />
        </mesh>
        {/* Strebe zum Turm */}
        <mesh position={[0, -0.4, -0.5]} rotation={[0.7, 0, 0]}>
          <boxGeometry args={[0.18, 0.9, 0.18]} />
          <meshStandardMaterial
            color={pirate ? palette.woodDark : palette.mortar}
            roughness={0.95}
          />
        </mesh>
      </group>

      {/* Figur */}
      <group ref={body} position={[0, 0, stand]}>
        {pirate ? (
          <PirateBody palette={palette} tex={tex} refs={refs} />
        ) : (
          <PrincessBody palette={palette} tex={tex} refs={refs} />
        )}
      </group>
    </group>
  );
}
