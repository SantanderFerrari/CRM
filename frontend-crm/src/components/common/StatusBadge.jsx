const STATUS_STYLES = {
  NEW:                'bg-blue-100   text-blue-700',
  ASSIGNED:           'bg-indigo-100 text-indigo-700',
  IN_PROGRESS:        'bg-yellow-100 text-yellow-700',
  CLOSED_CUST_PICKUP: 'bg-teal-100   text-teal-700',
  CLOSED:             'bg-green-100  text-green-700',
  REOPENED:           'bg-orange-100 text-orange-700',
  ESCALATED:          'bg-red-100    text-red-700',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
);

export default StatusBadge;