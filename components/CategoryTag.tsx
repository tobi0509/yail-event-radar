const TAG_COLORS: Record<string, string> = {
  Conference: "#A3C4F3",
  Hackathon: "#FDD2BF",
  Meetup: "#B8E0D2",
  Workshop: "#A3C4F3",
  Networking: "#B8E0D2",
  Webinar: "#F2F4F7",
  Other: "#F2F4F7",
};

interface CategoryTagProps {
  category: string;
}

export function CategoryTag({ category }: CategoryTagProps) {
  const bg = TAG_COLORS[category] ?? "#F2F4F7";

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-cta text-xs font-inter font-medium text-primary-text"
      style={{ backgroundColor: bg }}
    >
      {category}
    </span>
  );
}
