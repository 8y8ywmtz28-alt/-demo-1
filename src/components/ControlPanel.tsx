import { simulationActions, useSimulationStore } from '../store/simulationStore';

const presets = [
  ['silk', '轻薄丝绸'],
  ['canvas', '厚重帆布'],
  ['wind', '强风场'],
  ['lowGravity', '低重力'],
  ['pool', '水池'],
  ['viscous', '粘稠流体'],
  ['chaos', '混沌模式'],
] as const;

const Slider = ({ label, min, max, step, value, onChange }: any) => (
  <label className="control-row">
    <span>{label}</span>
    <div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <strong>{value.toFixed?.(2) ?? value}</strong>
    </div>
  </label>
);

export const ControlPanel = () => {
  const state = useSimulationStore();

  return (
    <aside className="panel">
      <h1>Physics Simulation Lab</h1>
      <p>Cloth · Sphere · Fluid</p>

      <section className="panel-card buttons">
        <button onClick={() => simulationActions.setRunning(!state.running)}>{state.running ? '暂停' : '开始'}</button>
        <button onClick={() => simulationActions.stepOnce()}>单步</button>
        <button onClick={() => simulationActions.reset()}>重置</button>
      </section>

      <section className="panel-card">
        <h3>预设</h3>
        <div className="preset-grid">
          {presets.map(([value, label]) => (
            <button key={value} className={state.preset === value ? 'active' : ''} onClick={() => simulationActions.applyPreset(value)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <h3>布料</h3>
        <Slider label="宽度" min={3} max={9} step={0.2} value={state.cloth.width} onChange={(v: number) => simulationActions.updateCloth('width', v)} />
        <Slider label="高度" min={2} max={6} step={0.2} value={state.cloth.height} onChange={(v: number) => simulationActions.updateCloth('height', v)} />
        <Slider label="分辨率X" min={12} max={48} step={1} value={state.cloth.segmentsX} onChange={(v: number) => simulationActions.updateCloth('segmentsX', v)} />
        <Slider label="分辨率Y" min={12} max={40} step={1} value={state.cloth.segmentsY} onChange={(v: number) => simulationActions.updateCloth('segmentsY', v)} />
        <Slider label="刚度" min={0.5} max={0.99} step={0.01} value={state.cloth.stiffness} onChange={(v: number) => simulationActions.updateCloth('stiffness', v)} />
        <Slider label="阻尼" min={0} max={0.08} step={0.002} value={state.cloth.damping} onChange={(v: number) => simulationActions.updateCloth('damping', v)} />
        <Slider label="风力" min={0} max={20} step={0.5} value={state.cloth.wind} onChange={(v: number) => simulationActions.updateCloth('wind', v)} />
        <div className="button-row">
          <button className={state.cloth.pinMode === 'topEdge' ? 'active' : ''} onClick={() => simulationActions.updatePinMode('topEdge')}>上边缘固定</button>
          <button className={state.cloth.pinMode === 'corners' ? 'active' : ''} onClick={() => simulationActions.updatePinMode('corners')}>四角固定</button>
          <button className={state.cloth.pinMode === 'none' ? 'active' : ''} onClick={() => simulationActions.updatePinMode('none')}>释放</button>
        </div>
      </section>

      <section className="panel-card">
        <h3>球体</h3>
        <Slider label="数量" min={1} max={4} step={1} value={state.spheres.length} onChange={(v: number) => simulationActions.setSphereCount(v)} />
        <Slider label="主球半径" min={0.3} max={1.2} step={0.02} value={state.spheres[0]?.radius ?? 0.7} onChange={(v: number) => simulationActions.updateSphere(0, { radius: v })} />
        <Slider label="主球质量" min={0.5} max={3} step={0.1} value={state.spheres[0]?.mass ?? 1} onChange={(v: number) => simulationActions.updateSphere(0, { mass: v })} />
        <Slider label="主球弹性" min={0.05} max={0.95} step={0.02} value={state.spheres[0]?.restitution ?? 0.4} onChange={(v: number) => simulationActions.updateSphere(0, { restitution: v })} />
      </section>

      <section className="panel-card">
        <h3>流体</h3>
        <Slider label="粒子数量" min={300} max={1500} step={10} value={state.fluid.particleCount} onChange={(v: number) => simulationActions.updateFluid('particleCount', v)} />
        <Slider label="粘度" min={0} max={1.5} step={0.02} value={state.fluid.viscosity} onChange={(v: number) => simulationActions.updateFluid('viscosity', v)} />
        <Slider label="压力" min={2} max={30} step={1} value={state.fluid.pressure} onChange={(v: number) => simulationActions.updateFluid('pressure', v)} />
        <Slider label="阻尼" min={0} max={0.08} step={0.002} value={state.fluid.damping} onChange={(v: number) => simulationActions.updateFluid('damping', v)} />
        <Slider label="粒子大小" min={0.04} max={0.18} step={0.005} value={state.fluid.particleSize} onChange={(v: number) => simulationActions.updateFluid('particleSize', v)} />
      </section>

      <section className="panel-card">
        <h3>全局 / 显示</h3>
        <Slider label="重力" min={-20} max={-1} step={0.1} value={state.global.gravity} onChange={(v: number) => simulationActions.updateGlobal('gravity', v)} />
        <Slider label="时间步长" min={0.005} max={0.03} step={0.001} value={state.global.timeStep} onChange={(v: number) => simulationActions.updateGlobal('timeStep', v)} />
        <Slider label="迭代次数" min={2} max={14} step={1} value={state.global.iterations} onChange={(v: number) => simulationActions.updateGlobal('iterations', v)} />
        <Slider label="碰撞精度" min={1} max={6} step={1} value={state.global.collisionPrecision} onChange={(v: number) => simulationActions.updateGlobal('collisionPrecision', v)} />

        {[
          ['showGrid', '网格'],
          ['showBounds', '边界'],
          ['showParticles', '粒子'],
          ['showVelocity', '速度向量'],
          ['showPerformance', '性能信息'],
        ].map(([key, label]) => (
          <label className="toggle" key={key}>
            <input type="checkbox" checked={(state.display as any)[key]} onChange={(e) => simulationActions.updateDisplay(key as any, e.target.checked)} />
            <span>{label}</span>
          </label>
        ))}
      </section>
    </aside>
  );
};
