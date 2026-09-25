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
        "inline-flex items-center self-center whitespace-nowrap rounded-md px-[0.65em] py-[0.35em] text-[0.75em] font-bold leading-none",
        badgeColorClasses[color],
      )}
    >
      {status}
    </span>
  );
}
