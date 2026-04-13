import { formatCurrency } from "@/lib/utils/format";

interface MonthData {
  month: string;
  amount: number;
}

interface Props {
  data: MonthData[];
}

export function CommissionChart({ data }: Props) {
  if (data.length === 0) return null;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-gray-900">Comisiones ultimos 6 meses</h2>
      <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
        {data.map((d) => {
          const pct = Math.max((d.amount / maxAmount) * 100, 4);
          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-700">
                {d.amount > 0 ? formatCurrency(d.amount) : "—"}
              </span>
              <div
                className="w-full rounded-t-md bg-teal-500 transition-all"
                style={{ height: `${pct}%`, minHeight: 4 }}
              />
              <span className="text-xs text-gray-400">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
