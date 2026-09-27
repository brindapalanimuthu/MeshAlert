interface SignalPulseProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export default function SignalPulse({ size = 120, color = 'currentColor', active = true }: SignalPulseProps) {
  return (
    <div
      className="relative flex items-center justify-center text-primary-500"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="relative z-10 rounded-full"
        style={{
          width: '18%',
          height: '18%',
          background: color,
          boxShadow: '0 0 20px currentColor',
        }}
      />
      {active && (
        <>
          <span
            className="absolute h-full w-full rounded-full border-[1.5px] border-solid opacity-0 animate-pulse-ring"
            style={{ borderColor: color }}
          />
          <span
            className="absolute h-full w-full rounded-full border-[1.5px] border-solid opacity-0 animate-pulse-ring"
            style={{ borderColor: color, animationDelay: '1s' }}
          />
          <span
            className="absolute h-full w-full rounded-full border-[1.5px] border-solid opacity-0 animate-pulse-ring"
            style={{ borderColor: color, animationDelay: '2s' }}
          />
        </>
      )}
    </div>
  );
}
