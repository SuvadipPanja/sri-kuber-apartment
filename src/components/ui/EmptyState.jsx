import Icon from '../Icon';

export default function EmptyState({ icon = 'info', title, description, action }) {
  return (
    <div className="empty-state-v3">
      <div className="empty-icon-wrap">
        <Icon name={icon} size={32} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
