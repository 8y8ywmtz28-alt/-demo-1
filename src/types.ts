import { Vector3 } from 'three';

export type ClothPinMode = 'topEdge' | 'corners' | 'none';

export interface GlobalParams {
  gravity: number;
  timeStep: number;
  iterations: number;
  collisionPrecision: number;
}

export interface ClothParams {
  width: number;
  height: number;
  segmentsX: number;
  segmentsY: number;
  stiffness: number;
  damping: number;
  wind: number;
  pinMode: ClothPinMode;
}

export interface SphereConfig {
  id: string;
  radius: number;
  mass: number;
  position: Vector3;
  velocity: Vector3;
  restitution: number;
  color: string;
}

export interface FluidParams {
  particleCount: number;
  viscosity: number;
  pressure: number;
  damping: number;
  particleSize: number;
  color: string;
}

export interface DisplayOptions {
  showGrid: boolean;
  showBounds: boolean;
  showParticles: boolean;
  showVelocity: boolean;
  showPerformance: boolean;
}

export interface SimulationState {
  running: boolean;
  singleStep: boolean;
  preset: string;
  global: GlobalParams;
  cloth: ClothParams;
  spheres: SphereConfig[];
  fluid: FluidParams;
  display: DisplayOptions;
}
