import { Line, OrbitControls, Stats } from '@react-three/drei';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Mesh, Plane, Ray, Vector3 } from 'three';
import { ClothSimulation } from '../physics/cloth';
import { FluidSimulation } from '../physics/fluid';
import { integrateSpheres } from '../physics/sphere';
import { simulationActions, useSimulationStore } from '../store/simulationStore';

const SceneContent = () => {
  const state = useSimulationStore();
  const clothSim = useRef(new ClothSimulation());
  const fluidSim = useRef(new FluidSimulation());
  const clothGeometry = useRef(new BufferGeometry());
  const fluidGeometry = useRef(new BufferGeometry());
  const [dragging, setDragging] = useState<number | null>(null);
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), -1.2), []);

  const clothNeedsReset = useRef(true);
  const fluidNeedsReset = useRef(true);

  useEffect(() => {
    clothNeedsReset.current = true;
  }, [state.cloth.width, state.cloth.height, state.cloth.segmentsX, state.cloth.segmentsY]);

  useEffect(() => {
    fluidNeedsReset.current = true;
  }, [state.fluid.particleCount]);

  useEffect(() => {
    clothSim.current.applyPinMode(state.cloth.pinMode);
  }, [state.cloth.pinMode]);

  useEffect(() => {
    const sx = state.cloth.segmentsX;
    const sy = state.cloth.segmentsY;
    const count = (sx + 1) * (sy + 1);
    clothGeometry.current.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
    const indices: number[] = [];
    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        const a = y * (sx + 1) + x;
        const b = a + 1;
        const c = a + (sx + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    clothGeometry.current.setIndex(indices);
  }, [state.cloth.segmentsX, state.cloth.segmentsY]);

  useEffect(() => {
    fluidGeometry.current.setAttribute(
      'position',
      new Float32BufferAttribute(new Float32Array(state.fluid.particleCount * 3), 3),
    );
  }, [state.fluid.particleCount]);

  useFrame((ctx, rawDt) => {
    const dt = Math.min(rawDt, state.global.timeStep);
    if (clothNeedsReset.current) {
      clothSim.current.initialize(state.cloth);
      clothNeedsReset.current = false;
    }
    if (fluidNeedsReset.current) {
      fluidSim.current.initialize(state.fluid);
      fluidNeedsReset.current = false;
    }

    const shouldRun = state.running || state.singleStep;
    if (shouldRun) {
      integrateSpheres(
        state.spheres.map((s) => ({ data: s })),
        dt,
        state.global.gravity,
        0.01,
      );
      clothSim.current.simulate(
        dt,
        state.global.gravity,
        state.cloth.wind,
        state.cloth.damping,
        state.cloth.stiffness,
        Math.max(1, Math.floor(state.global.iterations)),
        state.spheres,
      );
      fluidSim.current.simulate(dt, state.global.gravity, state.fluid, state.spheres);
      if (state.singleStep) simulationActions.consumeSingleStep();
    }

    clothSim.current.writeToGeometry(clothGeometry.current);
    fluidSim.current.writeToGeometry(fluidGeometry.current);

    if (state.display.showVelocity && Math.sin(ctx.clock.elapsedTime * 2) > 0.98) {
      clothSim.current.nudge(new Vector3(0, 2, Math.sin(ctx.clock.elapsedTime) * 1.4), 0.9, 0.18);
    }
  });

  const onSpherePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (dragging === null) return;
    event.stopPropagation();
    const ray = event.ray as Ray;
    const point = new Vector3();
    ray.intersectPlane(dragPlane, point);
    simulationActions.updateSphere(dragging, { position: point.clone(), velocity: new Vector3() });
  };

  return (
    <>
      <color attach="background" args={['#060712']} />
      <fog attach="fog" args={['#060712', 12, 26]} />
      <ambientLight intensity={0.35} color="#8fa5ff" />
      <directionalLight castShadow intensity={1.2} position={[6, 9, 4]} color="#cad8ff" shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight intensity={20} position={[-3, 5, 3]} color="#3ec2ff" distance={16} />

      {state.display.showGrid && <gridHelper args={[12, 48, '#5275ff', '#2f3f66']} position={[0, 0.01, 0]} />}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0b1221" roughness={0.8} metalness={0.2} />
      </mesh>

      <mesh castShadow receiveShadow geometry={clothGeometry.current} onPointerDown={(e) => clothSim.current.nudge(e.point, 1.2, 0.5)}>
        <meshStandardMaterial color="#7d8cff" roughness={0.35} metalness={0.05} side={DoubleSide} transparent opacity={0.88} />
      </mesh>

      {state.display.showParticles && (
        <points geometry={fluidGeometry.current}>
          <pointsMaterial size={state.fluid.particleSize} color={state.fluid.color} transparent opacity={0.75} depthWrite={false} />
        </points>
      )}

      {state.spheres.map((sphere, i) => (
        <mesh
          key={sphere.id}
          castShadow
          position={sphere.position}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDragging(i);
          }}
          onPointerUp={() => setDragging(null)}
          onPointerMove={onSpherePointerMove}
        >
          <sphereGeometry args={[sphere.radius, 36, 36]} />
          <meshPhysicalMaterial color={sphere.color} roughness={0.22} metalness={0.7} transmission={0.15} clearcoat={0.55} />
        </mesh>
      ))}

      {state.display.showBounds && (
        <Line
          points={[
            [-4.6, 0.05, -4.6], [4.6, 0.05, -4.6], [4.6, 0.05, 4.6], [-4.6, 0.05, 4.6], [-4.6, 0.05, -4.6],
            [-4.6, 4.8, -4.6], [4.6, 4.8, -4.6], [4.6, 4.8, 4.6], [-4.6, 4.8, 4.6], [-4.6, 4.8, -4.6],
          ] as any}
          color="#53baff"
          lineWidth={1}
          transparent
          opacity={0.45}
        />
      )}

      <OrbitControls makeDefault minDistance={4} maxDistance={20} />
      {state.display.showPerformance && <Stats className="stats" />}
    </>
  );
};

export const Scene = () => (
  <Canvas shadows camera={{ position: [7, 5, 8], fov: 45 }}>
    <SceneContent />
  </Canvas>
);
