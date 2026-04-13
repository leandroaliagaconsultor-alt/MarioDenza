interface Props {
  occupied: number;
  available: number;
  maintenance: number;
  total: number;
}

export function OccupancyChart({ occupied, available, maintenance, total }: Props) {
  if (total === 0) return null;

  const pctOccupied = Math.round((occupied / total) * 100);
  const pctAvailable = Math.round((available / total) * 100);
  const pctMaintenance = Math.round((maintenance / total) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Ocupacion</h2>
      <div className="mt-4 flex items-center gap-4">
        {/* Donut-style bar */}
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#0d9488" strokeWidth="3"
              strokeDasharray={`${pctOccupied} ${100 - pctOccupied}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{pctOccupied}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-teal-600" />
              <span className="text-gray-600">Ocupadas</span>
            </div>
            <span className="font-medium text-gray-900">{occupied}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-gray-600">Disponibles</span>
            </div>
            <span className="font-medium text-gray-900">{available}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-gray-600">Mantenimiento</span>
            </div>
            <span className="font-medium text-gray-900">{maintenance}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
