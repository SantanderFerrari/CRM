const BarChart = ({ data = [], color = '#4f46e5', height = 120 }) => {
  if (!data.length) return (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      No data yet
    </div>
  );

  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = Math.floor(100 / data.length);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${data.length * 36} ${height + 24}`}
        preserveAspectRatio="none"
        className="block"
        style={{ minWidth: `${data.length * 28}px` }}
      >
        {data.map((d, i) => {
          const barH   = Math.max((d.count / max) * height, 2);
          const x      = i * 36 + 4;
          const y      = height - barH;
          return (
            <g key={i}>
              <rect
                x={x} y={y}
                width={28} height={barH}
                rx={3}
                fill={color}
                opacity={0.85}
              />
              {/* Value on top if bar tall enough */}
              {barH > 16 && (
                <text
                  x={x + 14} y={y + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill="white"
                  fontWeight="600"
                >
                  {d.count}
                </text>
              )}
              {/* Day label */}
              <text
                x={x + 14} y={height + 16}
                textAnchor="middle"
                fontSize={8}
                fill="#9ca3af"
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BarChart;