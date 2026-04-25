import { useSyncExternalStore } from 'react';
import { Vector3 } from 'three';
import { ClothPinMode, SimulationState, SphereConfig } from '../types';

const sphereDefaults = (): SphereConfig[] => [
  {
    id: 'sphere-1',
    radius: 0.7,
    mass: 1,
    position: new Vector3(0, 1.2, 0),
    velocity: new Vector3(0, 0, 0),
    restitution: 0.45,
    color: '#7b8cff',
  },
];

export const presets: Record<string, Partial<SimulationState>> = {
  silk: { cloth: { stiffness: 0.78, damping: 0.02, wind: 4 } as any },
  canvas: { cloth: { stiffness: 0.95, damping: 0.04, wind: 1 } as any },
  wind: { cloth: { wind: 14 } as any },
  lowGravity: { global: { gravity: -3.2 } as any },
  pool: { fluid: { viscosity: 0.2, pressure: 10, damping: 0.012, particleCount: 900 } as any },
  viscous: { fluid: { viscosity: 1.35, pressure: 22, damping: 0.03, particleCount: 700 } as any },
  chaos: {
    global: { gravity: -12.5, iterations: 8 } as any,
    cloth: { wind: 18, stiffness: 0.82 } as any,
    fluid: { pressure: 24, viscosity: 0.55, particleCount: 1300 } as any,
  },
};

const initialState: SimulationState = {
  running: true,
  singleStep: false,
  preset: 'silk',
  global: {
    gravity: -9.81,
    timeStep: 1 / 60,
    iterations: 6,
    collisionPrecision: 2,
  },
  cloth: {
    width: 6,
    height: 4,
    segmentsX: 32,
    segmentsY: 24,
    stiffness: 0.88,
    damping: 0.03,
    wind: 4,
    pinMode: 'topEdge',
  },
  spheres: sphereDefaults(),
  fluid: {
    particleCount: 900,
    viscosity: 0.28,
    pressure: 11,
    damping: 0.012,
    particleSize: 0.09,
    color: '#43c7ff',
  },
  display: {
    showGrid: true,
    showBounds: true,
    showParticles: true,
    showVelocity: false,
    showPerformance: true,
  },
};

let state = initialState;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

const setState = (updater: (prev: SimulationState) => SimulationState) => {
  state = updater(state);
  notify();
};

const reset = () => {
  state = {
    ...initialState,
    spheres: sphereDefaults(),
  };
  notify();
};

const updatePinMode = (pinMode: ClothPinMode) => {
  setState((prev) => ({ ...prev, cloth: { ...prev.cloth, pinMode } }));
};

const applyPreset = (name: string) => {
  const preset = presets[name];
  if (!preset) return;
  setState((prev) => ({
    ...prev,
    preset: name,
    global: { ...prev.global, ...(preset.global ?? {}) },
    cloth: { ...prev.cloth, ...(preset.cloth ?? {}) },
    fluid: { ...prev.fluid, ...(preset.fluid ?? {}) },
  }));
};

const setSphereCount = (count: number) => {
  setState((prev) => {
    const target = Math.max(1, Math.min(4, count));
    const next = [...prev.spheres];
    while (next.length < target) {
      const id = `sphere-${next.length + 1}`;
      next.push({
        id,
        radius: 0.45 + Math.random() * 0.45,
        mass: 1,
        restitution: 0.4,
        position: new Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 1.2, (Math.random() - 0.5) * 2),
        velocity: new Vector3(),
        color: ['#7b8cff', '#46f0d2', '#f6a6ff', '#ff8a6b'][next.length % 4],
      });
    }
    next.length = target;
    return { ...prev, spheres: next };
  });
};

const updateSphere = (index: number, patch: Partial<SphereConfig>) => {
  setState((prev) => ({
    ...prev,
    spheres: prev.spheres.map((sphere, i) => (i === index ? { ...sphere, ...patch } : sphere)),
  }));
};

export const simulationActions = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  setRunning: (running: boolean) => setState((prev) => ({ ...prev, running })),
  stepOnce: () => setState((prev) => ({ ...prev, singleStep: true })),
  consumeSingleStep: () => setState((prev) => ({ ...prev, singleStep: false })),
  updateGlobal: (key: keyof SimulationState['global'], value: number) =>
    setState((prev) => ({ ...prev, global: { ...prev.global, [key]: value } })),
  updateCloth: (key: keyof SimulationState['cloth'], value: number) =>
    setState((prev) => ({ ...prev, cloth: { ...prev.cloth, [key]: value } })),
  updateFluid: (key: keyof SimulationState['fluid'], value: number | string) =>
    setState((prev) => ({ ...prev, fluid: { ...prev.fluid, [key]: value } })),
  updateDisplay: (key: keyof SimulationState['display'], value: boolean) =>
    setState((prev) => ({ ...prev, display: { ...prev.display, [key]: value } })),
  updatePinMode,
  updateSphere,
  setSphereCount,
  applyPreset,
  reset,
};

export const useSimulationStore = () =>
  useSyncExternalStore(simulationActions.subscribe, simulationActions.getSnapshot, simulationActions.getSnapshot);
