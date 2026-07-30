import { cn } from "@/lib/utils";
import { badgeColorClasses } from "./helpers/badgeColors";

const statusColors: Record<string, string> = {
  Active: "primary",
  Approved: "primary",
  New: "secondary",
  Pending: "secondary",
  "Under Review": "secondary",
  "Returned for Corrections": "secondary",
};

export default function StatusBadge({ status, title }: { status: string; title?: string }) {
  const color = statusColors[status] || "dark";
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center self-center rounded-full px-2 py-0.5 text-xs font-medium",
        badgeColorClasses[color],
      )}
    >
      {status}
    </span>
  );
}
