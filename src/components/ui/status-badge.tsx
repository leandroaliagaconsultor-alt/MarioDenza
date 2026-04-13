import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  label: string;
  colorClass: string;
}

export function StatusBadge({ label, colorClass }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
