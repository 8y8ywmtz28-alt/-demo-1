import { Vector3 } from 'three';
import { SphereState } from './sphere';

export interface BoundBox {
  min: Vector3;
  max: Vector3;
}

export const resolveParticleSphere = (position: Vector3, sphere: SphereState, cushion = 0.001) => {
  const dir = position.clone().sub(sphere.data.position);
  const len = dir.length();
  const minLen = sphere.data.radius + cushion;
  if (len < minLen && len > 1e-6) {
    dir.multiplyScalar((minLen - len) / len);
    position.add(dir);
  }
};

export const confineToBounds = (position: Vector3, bounds: BoundBox, bounce = 0.2, velocity?: Vector3) => {
  for (const axis of ['x', 'y', 'z'] as const) {
    if (position[axis] < bounds.min[axis]) {
      position[axis] = bounds.min[axis];
      if (velocity) velocity[axis] *= -bounce;
    }
    if (position[axis] > bounds.max[axis]) {
      position[axis] = bounds.max[axis];
      if (velocity) velocity[axis] *= -bounce;
    }
  }
};
