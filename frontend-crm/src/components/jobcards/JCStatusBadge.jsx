const JC_STATUS_STYLES = {
  CREATED:          'bg-gray-100    text-gray-600',
  CHECKLIST_PENDING:'bg-blue-100    text-blue-700',
  IN_PROGRESS:      'bg-yellow-100  text-yellow-700',
  COMPLETED:        'bg-teal-100    text-teal-700',
  PENDING_APPROVAL: 'bg-orange-100  text-orange-700',
  CLOSED:           'bg-green-100   text-green-700',
};

const JCStatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${JC_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
);

export default JCStatusBadge;