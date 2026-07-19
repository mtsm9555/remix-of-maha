interface Props {
  title: string;
  progress: number;
}

export default function GoalTracker({ title, progress }: Props) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div className="goal-tracker">
      <h4>{title}</h4>
      <div className="goal-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className="goal-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span>{clamped}%</span>
    </div>
  );
}