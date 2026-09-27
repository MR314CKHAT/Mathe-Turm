import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { skyFor } from '../utils/theme.js';

/**
 * Der 3D-Himmel: Kuppel mit Farbverlauf (kommt aus skyFor() – denselben
 * Zonen wie die 2D-Welt) plus Sterne. `SkyController` mischt alle Werte
 * weich Richtung Zielhöhe, damit beim Klettern Morgenrot fließend in
 * Sternennacht übergeht.
 */

const DOME_R = 380;

/** Geteilte Himmels-Werte: werden von SkyController pro Frame gemischt. */
export function createSkyState(theme, floor) {
  const sky = skyFor(theme, floor);
  return {
    top: new THREE.Color(sky.top),
    mid: new THREE.Color(sky.mid),
    bottom: new THREE.Color(sky.bottom),
    stars: sky.stars,
    sun: sky.sun,
    moon: sky.moon,
    rainbow: sky.rainbow,
    magic: sky.magic,
    night: sky.stars,
    smoothFloor: floor,
  };
}

const tmpColor = new THREE.Color();

/** Mischt Himmel, Nebel und Licht Richtung aktueller Etage. */
export function SkyController({ theme, floor, sky, hemiRef, sunRef }) {
  const scene = useThree((s) => s.scene);

  const fog = useMemo(() => new THREE.Fog(sky.mid.getHex(), 26, 95), []); // eslint-disable-line react-hooks/exhaustive-deps
  const background = useMemo(() => new THREE.Color(sky.bottom), []); // eslint-disable-line react-hooks/exhaustive-deps

  useMemo(() => {
    scene.fog = fog;
    scene.background = background;
  }, [scene, fog, background]);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-2.2 * delta); // weiches Dämpfen
    sky.smoothFloor += (floor - sky.smoothFloor) * k;
    const target = skyFor(theme, sky.smoothFloor);

    sky.top.lerp(tmpColor.set(target.top), k);
    sky.mid.lerp(tmpColor.set(target.mid), k);
    sky.bottom.lerp(tmpColor.set(target.bottom), k);
    sky.stars += (target.stars - sky.stars) * k;
    sky.sun += (target.sun - sky.sun) * k;
    sky.moon += (target.moon - sky.moon) * k;
    sky.rainbow += (target.rainbow - sky.rainbow) * k;
    sky.magic += (target.magic - sky.magic) * k;
    sky.night = sky.stars;

    fog.color.copy(sky.mid);
    background.copy(sky.bottom);

    if (hemiRef?.current) {
      hemiRef.current.color.copy(sky.mid).lerp(tmpColor.set('#ffffff'), 0.45);
      hemiRef.current.intensity = 0.85 - sky.night * 0.35;
    }
    if (sunRef?.current) {
      // Abends warmes Licht, nachts kühles Mondlicht
      sunRef.current.color
        .set('#fff3d6')
        .lerp(tmpColor.set('#aebfff'), sky.night);
      sunRef.current.intensity = 1.15 - sky.night * 0.45;
    }
  });

  return null;
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 col = mix(uBottom, uMid, smoothstep(-0.10, 0.22, h));
    col = mix(col, uTop, smoothstep(0.18, 0.72, h));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Himmelskuppel + Sterne; folgt der Kamera, damit man nie den Rand sieht. */
export function SkyDome({ sky }) {
  const group = useRef();
  const starsMat = useRef();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: sky.top },
          uMid: { value: sky.mid },
          uBottom: { value: sky.bottom },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
      }),
    [sky]
  );

  const domeGeometry = useMemo(
    () => new THREE.SphereGeometry(DOME_R, 32, 20),
    []
  );

  const starGeometry = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // gleichmäßig auf der oberen Halbkugel verteilt
      const u = (i * 0.61803398875) % 1;
      const v = ((i * 0.7548776662) % 1) * 0.92 + 0.06;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(1 - v);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * (DOME_R - 12);
      positions[i * 3 + 1] = Math.cos(phi) * (DOME_R - 12);
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * (DOME_R - 12);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ camera, clock }) => {
    if (group.current) group.current.position.copy(camera.position);
    if (starsMat.current) {
      const twinkle = 0.85 + Math.sin(clock.elapsedTime * 2.4) * 0.15;
      starsMat.current.opacity = sky.stars * twinkle;
    }
  });

  return (
    <group ref={group}>
      <mesh material={material} geometry={domeGeometry} />
      <points geometry={starGeometry}>
        <pointsMaterial
          ref={starsMat}
          color="#fff8e0"
          size={2.1}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
        />
      </points>
    </group>
  );
}
