// A pulsing concentric-ring animation representing a mesh signal.
// size: pixel diameter of the component. color: CSS variable or hex for the rings.
function SignalPulse({ size = 120, color = 'var(--signal-teal)', active = true }) {
  return (
    <div
      className="signal-pulse"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="signal-pulse__core" style={{ background: color }} />
      {active && (
        <>
          <span className="signal-pulse__ring signal-pulse__ring--1" style={{ borderColor: color }} />
          <span className="signal-pulse__ring signal-pulse__ring--2" style={{ borderColor: color }} />
          <span className="signal-pulse__ring signal-pulse__ring--3" style={{ borderColor: color }} />
        </>
      )}
    </div>
  );
}

export default SignalPulse;