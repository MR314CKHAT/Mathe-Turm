import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { SkyController, SkyDome, createSkyState } from './SkyDome.jsx';
import { Celestials, MagicDust, Rainbow } from './SkyExtras.jsx';
import Clouds from './Clouds.jsx';
import CastleWorld from './CastleWorld.jsx';
import Ground3D from './Ground3D.jsx';
import PirateWorld from './PirateWorld.jsx';
import Character3D from './Character3D.jsx';
import CameraRig from './CameraRig.jsx';
import Effects3D from './Particles3D.jsx';

/**
 * Die komplette 3D-Bühne. Bekommt dieselben Props wie der alte 2D-Turm
 * (floor, theme, mood, burst, rain, sparkle, shake) – der Rest passiert
 * hier drin: Himmel, Welt, Figur, Kamera, Effekte.
 *
 * preview=true: langsame Kamera-Drehung um die Welt (Startscreen).
 */
export default function World3D({
  theme = 'princess',
  floor = 0,
  mood = 'idle',
  burst = 0,
  rain = 0,
  sparkle = 0,
  shake = 0,
  preview = false,
}) {
  const sky = useMemo(() => createSkyState(theme, floor), []); // eslint-disable-line react-hooks/exhaustive-deps
  const hemi = useRef();
  const sun = useRef();

  return (
    <Canvas
      flat
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 2.1, 11.8], fov: 55, near: 0.1, far: 900 }}
    >
      <hemisphereLight ref={hemi} args={['#cfe6ff', '#7a9a5f', 0.9]} />
      <directionalLight
        ref={sun}
        position={[6, 12, 7]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={42}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={12}
        shadow-camera-bottom={-7}
      />

      <SkyController theme={theme} floor={floor} sky={sky} hemiRef={hemi} sunRef={sun} />
      <SkyDome sky={sky} />
      <Celestials sky={sky} />
      <Rainbow sky={sky} />
      <MagicDust sky={sky} />
      <Clouds />

      {theme === 'pirate' ? (
        <PirateWorld theme={theme} />
      ) : (
        <>
          <CastleWorld theme={theme} floor={floor} sky={sky} />
          <Ground3D theme={theme} />
        </>
      )}

      <Character3D theme={theme} mood={mood} floor={floor} />
      <Effects3D theme={theme} floor={floor} burst={burst} rain={rain} sparkle={sparkle} />
      <CameraRig floor={floor} shake={shake} preview={preview} lightRef={sun} />
    </Canvas>
  );
}
