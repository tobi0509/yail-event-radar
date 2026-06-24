interface ScoreBadgeProps {
  score: number | null;
  ratingCount: number | null;
}

export function ScoreBadge({ score, ratingCount }: ScoreBadgeProps) {
  const count = ratingCount ?? 0;
  const hasRatings = count > 0 && score !== null;

  if (!hasRatings) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-cta text-xs font-inter font-medium bg-[#F2F4F7] text-[#B0B0B0] whitespace-nowrap">
        Noch keine Bewertungen
      </span>
    );
  }

  const rounded = Math.round(score!);
  const stars = "★".repeat(rounded) + "☆".repeat(5 - rounded);

  let className =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-cta text-sm font-bold font-mono whitespace-nowrap ";

  if (rounded === 5) {
    className += "bg-gradient-to-r from-accent-blue to-mint text-primary-text";
  } else if (rounded === 4) {
    className += "bg-mint text-primary-text";
  } else if (rounded === 3) {
    className += "bg-accent-blue text-primary-text";
  } else {
    className += "bg-bg-muted text-secondary-text";
  }

  return (
    <span className={className}>
      {stars}
      <span className="text-xs font-inter font-normal opacity-70">({count})</span>
    </span>
  );
}
