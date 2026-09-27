import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOOR_H } from './world3d.js';

/**
 * Die Kamera: folgt der Spielfigur weich nach oben, schwebt leicht,
 * reagiert mit Parallax auf Maus/Finger und bebt bei falschen Antworten.
 * Im Vorschau-Modus (Startscreen) umkreist sie langsam den Turm.
 * Bewegt außerdem das Hauptlicht mit, damit Schatten immer stimmen.
 */
export default function CameraRig({ floor, shake = 0, preview = false, lightRef }) {
  const shakeImpulse = useRef(0);
  const lastShake = useRef(shake);
  const smoothY = useRef(floor * FLOOR_H);

  // Weniger Bewegung, wenn das System darum bittet: kein Schweben/Parallax
  const reduced = useRef(
    typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );

  useEffect(() => {
    if (shake !== lastShake.current) {
      lastShake.current = shake;
      if (shake > 0) shakeImpulse.current = 1;
    }
  }, [shake]);

  useFrame(({ camera, pointer, clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;

    smoothY.current = THREE.MathUtils.damp(
      smoothY.current,
      floor * FLOOR_H,
      3.2,
      dt
    );
    const y = smoothY.current;

    if (preview) {
      const a = t * 0.26;
      camera.position.x = Math.sin(a) * 12.5;
      camera.position.z = Math.cos(a) * 12.5;
      camera.position.y = y + 2.6 + Math.sin(t * 0.5) * 0.4;
      camera.lookAt(0, y + 1.8, 0);
    } else {
      const px = reduced.current ? 0 : pointer.x * 1.6;
      const py = reduced.current ? 0 : pointer.y * 0.9;
      const sway = reduced.current ? 0 : Math.sin(t * 0.4) * 0.35;
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        px + sway,
        4,
        dt
      );
      camera.position.y = THREE.MathUtils.damp(camera.position.y, y + 2.1 + py, 4, dt);
      camera.position.z = 11.8;
      camera.lookAt(0, y + 1.4, 0);
    }

    // Beben bei falscher Antwort
    if (shakeImpulse.current > 0.001) {
      camera.position.x += (Math.random() - 0.5) * 0.45 * shakeImpulse.current;
      camera.position.y += (Math.random() - 0.5) * 0.35 * shakeImpulse.current;
      shakeImpulse.current *= Math.exp(-5 * dt);
    }

    // Hauptlicht folgt der Figur
    if (lightRef?.current) {
      lightRef.current.position.set(6, y + 9, 7);
      lightRef.current.target.position.set(0, y, 0);
      lightRef.current.target.updateMatrixWorld();
    }
  });

  return null;
}
