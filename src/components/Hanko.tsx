import { formatRating } from "@/lib/rating";

export function Hanko({ half, size = "md" }: { half: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "hanko hanko-sm" : size === "lg" ? "hanko hanko-lg" : "hanko";
  const label = formatRating(half);
  return (
    <span className={cls} aria-label={`nota ${label} de 5`}>
      {label}
    </span>
  );
}
