import { BufferGeometry, Vector3 } from 'three';
import { FluidParams, SphereConfig } from '../types';
import { confineToBounds, resolveParticleSphere } from './collision';

interface FluidParticle {
  pos: Vector3;
  vel: Vector3;
  density: number;
  pressure: number;
}

const CONTAINER_MIN = new Vector3(-4.6, 0.05, -4.6);
const CONTAINER_MAX = new Vector3(4.6, 4.8, 4.6);

export class FluidSimulation {
  particles: FluidParticle[] = [];
  kernelRadius = 0.42;

  initialize(params: FluidParams) {
    this.particles = [];
    const side = Math.ceil(Math.cbrt(params.particleCount));
    const spacing = 0.2;

    for (let i = 0; i < params.particleCount; i++) {
      const x = i % side;
      const y = Math.floor(i / (side * side));
      const z = Math.floor(i / side) % side;
      this.particles.push({
        pos: new Vector3(-1.4 + x * spacing, 0.7 + y * spacing, -1.4 + z * spacing),
        vel: new Vector3((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2),
        density: 1,
        pressure: 0,
      });
    }
  }

  simulate(dt: number, gravity: number, params: FluidParams, spheres: SphereConfig[]) {
    const h2 = this.kernelRadius * this.kernelRadius;

    for (const p of this.particles) {
      let density = 0;
      for (const q of this.particles) {
        const r2 = p.pos.distanceToSquared(q.pos);
        if (r2 < h2) density += 1 - Math.sqrt(r2) / this.kernelRadius;
      }
      p.density = density;
      p.pressure = Math.max(0, (density - 6) * params.pressure * 0.05);
    }

    for (const p of this.particles) {
      const pressureForce = new Vector3();
      const viscous = new Vector3();

      for (const q of this.particles) {
        if (q === p) continue;
        const dir = q.pos.clone().sub(p.pos);
        const dist = dir.length();
        if (dist > 1e-6 && dist < this.kernelRadius) {
          const influence = 1 - dist / this.kernelRadius;
          pressureForce.addScaledVector(dir.normalize(), -0.3 * (p.pressure + q.pressure) * influence);
          viscous.addScaledVector(q.vel.clone().sub(p.vel), params.viscosity * influence * 0.05);
        }
      }

      p.vel.addScaledVector(pressureForce, dt);
      p.vel.addScaledVector(viscous, dt);
      p.vel.y += gravity * dt * 0.8;
      p.vel.multiplyScalar(1 - params.damping);
      p.pos.addScaledVector(p.vel, dt);

      for (const sphere of spheres) resolveParticleSphere(p.pos, { data: sphere }, params.particleSize * 0.7);
      confineToBounds(p.pos, { min: CONTAINER_MIN, max: CONTAINER_MAX }, 0.18, p.vel);
    }
  }

  writeToGeometry(geometry: BufferGeometry) {
    const attr = geometry.attributes.position;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i].pos;
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
  }
}
