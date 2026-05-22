import { getPriorityConfig, getStatusConfig } from '../../utils/helpers';

export function PriorityBadge({ priority }) {
  const config = getPriorityConfig(priority);
  return (
    <span className={`badge ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  return (
    <span className={`badge ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
