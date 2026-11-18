import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { District } from '../../data/districts';
import { MONORAIL_CURVE } from './Transit';

export type CameraView = 'aerial' | 'street' | 'district' | 'monorail';

/** High aerial view — elevated enough to see skyscrapers from above */
export const INTRO_CAMERA_POSITION: [number, number, number] = [52, 55, 65];

const PRESETS: Record<'aerial' | 'street', { position: THREE.Vector3; target: THREE.Vector3 }> = {
  aerial: { position: new THREE.Vector3(52, 55, 65), target: new THREE.Vector3(0, 2, 0) },
  street: { position: new THREE.Vector3(2.3, 1.25, 22), target: new THREE.Vector3(1, 0.95, 6) },
};

function districtView(d: District) {
  const [cx, , cz] = d.position;
  return {
    position: new THREE.Vector3(cx + Math.sign(cx) * 8, 11, cz + Math.sign(cz) * 15),
    target: new THREE.Vector3(cx, 1.5, cz),
  };
}

interface Props {
  view: CameraView;
  focus: District | null;
  ready: boolean;
  reducedMotion: boolean;
  trainProgress: MutableRefObject<number>;
}

export function CameraRig({ view, focus, ready, reducedMotion, trainProgress }: Props) {
  const camera = useThree(s => s.camera);
  const controls = useThree(s => s.controls) as OrbitControlsImpl | null;
  const goal = useMemo(() => ({ position: new THREE.Vector3(), target: new THREE.Vector3() }), []);
  const ride = useMemo(() => ({ eye: new THREE.Vector3(), look: new THREE.Vector3(), blend: 0 }), []);
  const animating = useRef(false);

  useEffect(() => {
    if (!ready || view === 'monorail') {
      ride.blend = 0;
      return;
    }
    const next = view === 'district' && focus ? districtView(focus) : PRESETS[view === 'street' ? 'street' : 'aerial'];
    goal.position.copy(next.position);
    goal.target.copy(next.target);
    if (reducedMotion && controls) {
      camera.position.copy(goal.position);
      controls.target.copy(goal.target);
      controls.update();
      animating.current = false;
    } else {
      animating.current = true;
    }
  }, [view, focus, ready, reducedMotion, camera, controls, goal, ride]);

  // Don't cancel programmatic transitions — let them finish so the city is always visible.
  // The user can still drag freely afterwards because lerp naturally yields to OrbitControls.

  useFrame((_, delta) => {
    if (!controls) return;

    if (view === 'monorail') {
      controls.enabled = false;
      const u = trainProgress.current;
      MONORAIL_CURVE.getPointAt(u, ride.eye);
      MONORAIL_CURVE.getPointAt((u + 0.035) % 1, ride.look);
      ride.eye.y += 0.95;
      ride.look.y += 0.7;
      ride.blend = reducedMotion ? 1 : Math.min(1, ride.blend + delta * 0.8);
      const k = ride.blend >= 1 ? 1 : 1 - Math.exp(-delta * 4 * (0.3 + ride.blend));
      camera.position.lerp(ride.eye, k);
      controls.target.lerp(ride.look, k);
      camera.lookAt(controls.target);
      return;
    }

    controls.enabled = true;
    if (!animating.current) return;
    const k = 1 - Math.exp(-delta * 1.8);
    camera.position.lerp(goal.position, k);
    controls.target.lerp(goal.target, k);
    controls.update();
    if (camera.position.distanceTo(goal.position) < 0.05 && controls.target.distanceTo(goal.target) < 0.05) {
      animating.current = false;
    }
  });

  return null;
}
