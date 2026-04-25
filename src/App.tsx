import { Scene } from './components/Scene';
import { ControlPanel } from './components/ControlPanel';
import { useSimulationStore } from './store/simulationStore';

const App = () => {
  const state = useSimulationStore();

  return (
    <div className="app-shell">
      <div className="canvas-wrap">
        <Scene />
        <div className="hud">
          <span>Particles: {state.fluid.particleCount}</span>
          <span>Spheres: {state.spheres.length}</span>
          <span>Cloth: {state.cloth.segmentsX} x {state.cloth.segmentsY}</span>
        </div>
      </div>
      <ControlPanel />
    </div>
  );
};

export default App;
