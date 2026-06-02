import Icon from '../Icon';

/**
 * Unified page header for redesign v3
 */
export default function PageShell({ icon, title, subtitle, actions, children, className = '' }) {
  return (
    <div className={className}>
      <header className="page-hero">
        <div className="page-hero-inner">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            {icon && (
              <div className="page-hero-icon" aria-hidden>
                <Icon name={icon} size={26} />
              </div>
            )}
            <div>
              <h1>{title}</h1>
              {subtitle && <p className="page-hero-sub">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="page-hero-actions">{actions}</div>}
        </div>
      </header>
      {children}
    </div>
  );
}
