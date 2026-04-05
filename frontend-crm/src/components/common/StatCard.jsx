const StatCard = ({ label, value, sub, color = 'gray', loading }) => {
  const colors = {
    gray:   'bg-gray-50   border-gray-200',
    blue:   'bg-blue-50   border-blue-200',
    green:  'bg-green-50  border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red:    'bg-red-50    border-red-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  const textColors = {
    gray:   'text-gray-700',
    blue:   'text-blue-700',
    green:  'text-green-700',
    yellow: 'text-yellow-700',
    red:    'text-red-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className={`mt-1 text-3xl font-semibold ${textColors[color]}`}>{value ?? '—'}</p>
      )}
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
};

export default StatCard;