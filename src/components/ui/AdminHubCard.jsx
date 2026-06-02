import { Link } from 'react-router-dom';
import Icon from '../Icon';

const HUB_STYLES = {
  green:  { '--hub-bg': 'rgba(34, 197, 94, 0.12)', '--hub-color': '#4ade80', '--hub-glow': 'rgba(34, 197, 94, 0.08)' },
  red:    { '--hub-bg': 'rgba(244, 63, 94, 0.12)', '--hub-color': '#fb7185', '--hub-glow': 'rgba(244, 63, 94, 0.08)' },
  accent: { '--hub-bg': 'rgba(20, 184, 166, 0.12)', '--hub-color': '#2dd4bf', '--hub-glow': 'rgba(20, 184, 166, 0.08)' },
  blue:   { '--hub-bg': 'var(--primary-glow)', '--hub-color': 'var(--primary-light)', '--hub-glow': 'var(--primary-glow)' },
  gold:   { '--hub-bg': 'rgba(245, 158, 11, 0.12)', '--hub-color': '#fbbf24', '--hub-glow': 'rgba(245, 158, 11, 0.08)' },
  info:   { '--hub-bg': 'rgba(99, 102, 241, 0.12)', '--hub-color': '#a5b4fc', '--hub-glow': 'var(--primary-glow)' },
};

export default function AdminHubCard({ title, description, path, icon, color = 'blue' }) {
  const style = HUB_STYLES[color] || HUB_STYLES.blue;
  return (
    <Link to={path} className="admin-hub-card" style={style}>
      <div className="admin-hub-icon">
        <Icon name={icon} size={22} />
      </div>
      <div>
        <div className="admin-hub-title">{title}</div>
        <div className="admin-hub-desc">{description}</div>
      </div>
    </Link>
  );
}
