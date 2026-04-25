import { BufferGeometry, Vector3 } from 'three';
import { ClothParams, SphereConfig } from '../types';
import { resolveParticleSphere } from './collision';

interface ClothNode {
  pos: Vector3;
  prev: Vector3;
  pinned: boolean;
}

interface Link {
  a: number;
  b: number;
  rest: number;
}

export class ClothSimulation {
  nodes: ClothNode[] = [];
  links: Link[] = [];
  width = 0;
  height = 0;
  sx = 0;
  sy = 0;

  initialize(params: ClothParams) {
    this.width = params.width;
    this.height = params.height;
    this.sx = params.segmentsX;
    this.sy = params.segmentsY;
    this.nodes = [];
    this.links = [];

    for (let y = 0; y <= this.sy; y++) {
      for (let x = 0; x <= this.sx; x++) {
        const px = (x / this.sx - 0.5) * this.width;
        const py = 3.6 - (y / this.sy) * this.height;
        const pz = 0;
        const pos = new Vector3(px, py, pz);
        this.nodes.push({ pos: pos.clone(), prev: pos.clone(), pinned: false });
      }
    }

    const link = (x1: number, y1: number, x2: number, y2: number) => {
      const a = y1 * (this.sx + 1) + x1;
      const b = y2 * (this.sx + 1) + x2;
      const rest = this.nodes[a].pos.distanceTo(this.nodes[b].pos);
      this.links.push({ a, b, rest });
    };

    for (let y = 0; y <= this.sy; y++) {
      for (let x = 0; x <= this.sx; x++) {
        if (x < this.sx) link(x, y, x + 1, y);
        if (y < this.sy) link(x, y, x, y + 1);
        if (x < this.sx && y < this.sy) {
          link(x, y, x + 1, y + 1);
          link(x + 1, y, x, y + 1);
        }
      }
    }

    this.applyPinMode(params.pinMode);
  }

  applyPinMode(mode: ClothParams['pinMode']) {
    this.nodes.forEach((n) => (n.pinned = false));
    const rowStride = this.sx + 1;
    if (mode === 'topEdge') {
      for (let x = 0; x <= this.sx; x++) this.nodes[x].pinned = true;
    } else if (mode === 'corners') {
      this.nodes[0].pinned = true;
      this.nodes[this.sx].pinned = true;
      this.nodes[this.sy * rowStride].pinned = true;
      this.nodes[this.sy * rowStride + this.sx].pinned = true;
    }
  }

  simulate(dt: number, gravity: number, wind: number, damping: number, stiffness: number, iterations: number, spheres: SphereConfig[]) {
    const force = new Vector3(0, gravity, wind * 0.35);

    for (const node of this.nodes) {
      if (node.pinned) continue;
      const vel = node.pos.clone().sub(node.prev).multiplyScalar(1 - damping);
      node.prev.copy(node.pos);
      node.pos.add(vel).addScaledVector(force, dt * dt);
    }

    for (let i = 0; i < iterations; i++) {
      for (const l of this.links) {
        const a = this.nodes[l.a];
        const b = this.nodes[l.b];
        const delta = b.pos.clone().sub(a.pos);
        const dist = delta.length() || 1e-6;
        const diff = ((dist - l.rest) / dist) * stiffness;
        if (!a.pinned) a.pos.addScaledVector(delta, diff * 0.5);
        if (!b.pinned) b.pos.addScaledVector(delta, -diff * 0.5);
      }

      for (const node of this.nodes) {
        if (!node.pinned && node.pos.y < 0.05) node.pos.y = 0.05;
        for (const sphere of spheres) resolveParticleSphere(node.pos, { data: sphere }, 0.02);
      }
    }
  }

  nudge(position: Vector3, radius: number, impulse = 0.28) {
    for (const node of this.nodes) {
      const d = node.pos.distanceTo(position);
      if (d < radius && !node.pinned) {
        const dir = node.pos.clone().sub(position).normalize();
        node.pos.addScaledVector(dir, impulse * (1 - d / radius));
      }
    }
  }

  writeToGeometry(geometry: BufferGeometry) {
    const attr = geometry.attributes.position;
    for (let i = 0; i < this.nodes.length; i++) {
      const p = this.nodes[i].pos;
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
