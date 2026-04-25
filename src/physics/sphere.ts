import { SphereConfig } from '../types';

export interface SphereState {
  data: SphereConfig;
}

export const integrateSpheres = (spheres: SphereState[], dt: number, gravity: number, damping: number) => {
  for (const sphere of spheres) {
    sphere.data.velocity.y += gravity * dt;
    sphere.data.velocity.multiplyScalar(1 - damping);
    sphere.data.position.addScaledVector(sphere.data.velocity, dt);

    const r = sphere.data.radius;
    if (sphere.data.position.y - r < 0) {
      sphere.data.position.y = r;
      sphere.data.velocity.y *= -sphere.data.restitution;
      sphere.data.velocity.x *= 0.97;
      sphere.data.velocity.z *= 0.97;
    }

    for (const axis of ['x', 'z'] as const) {
      const v = sphere.data.position[axis];
      const limit = 4.8 - r;
      if (v > limit || v < -limit) {
        sphere.data.position[axis] = Math.max(-limit, Math.min(limit, v));
        sphere.data.velocity[axis] *= -sphere.data.restitution;
      }
    }
  }
};
