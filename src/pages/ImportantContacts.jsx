import { useState } from 'react';
import { useSupabaseTable } from '../hooks/useSupabase';
import { getInitials } from '../utils/formatters';
import Icon from '../components/Icon';

/* ── Category metadata ── */
const CATEGORIES = [
  { label: 'All',                icon: 'contactBook', color: 'var(--primary)' },
  { label: 'Plumber',            icon: 'droplet',     color: '#3b82f6' },
  { label: 'Electrician',        icon: 'zap',         color: '#f59e0b' },
  { label: 'Carpenter',          icon: 'hammer',      color: '#d97706' },
  { label: 'Security Guard',     icon: 'shield',      color: '#ef4444' },
  { label: 'Lift Maintenance',   icon: 'building',    color: '#8b5cf6' },
  { label: 'Pest Control',       icon: 'wrench',      color: '#10b981' },
  { label: 'Cleaner / Sweeper',  icon: 'wrench',      color: '#14b8a6' },
  { label: 'Water Supply',       icon: 'droplet',     color: '#06b6d4' },
  { label: 'Generator',          icon: 'zap',         color: '#f97316' },
  { label: 'Fire Safety',        icon: 'warning',     color: '#dc2626' },
  { label: 'Internet / Cable',   icon: 'wrench',      color: '#6366f1' },
  { label: 'Other',              icon: 'info',        color: '#6b7280' },
];

function getCatMeta(label) {
  return CATEGORIES.find(c => c.label === label) || CATEGORIES.find(c => c.label === 'Other');
}

/* ── Avatar (photo or initials) ── */
function Avatar({ photoUrl, name, color }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="contact-avatar-img"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div className="contact-avatar-initials" style={{ background: color + '22', color }}>
      {getInitials(name)}
    </div>
  );
}

/* ── Contact card ── */
function ContactCard({ contact }) {
  const meta  = getCatMeta(contact.category);
  const color = meta.color;

  const handleCall = () => {
    window.location.href = `tel:${contact.phone}`;
  };

  return (
    <div className="contact-card">
      {/* Top accent */}
      <div className="contact-card-accent" style={{ background: color }}/>

      {/* Photo */}
      <div className="contact-avatar-wrap" style={{ borderColor: color + '44' }}>
        <Avatar photoUrl={contact.photo_url} name={contact.name} color={color}/>
        <div className="contact-avatar-initials" style={{ display: 'none', background: color + '22', color }}>
          {getInitials(contact.name)}
        </div>
      </div>

      {/* Info */}
      <div className="contact-name">{contact.name}</div>

      {/* Category badge */}
      <div className="contact-cat-badge" style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
        <Icon name={meta.icon} size={12}/>
        <span>{contact.category}</span>
      </div>

      {/* Phone */}
      <a href={`tel:${contact.phone}`} className="contact-phone">
        <Icon name="phone" size={14}/>
        <span>{contact.phone}</span>
      </a>

      {/* Availability */}
      {contact.available && (
        <div className="contact-avail">
          <Icon name="clock" size={12}/>
          <span>{contact.available}</span>
        </div>
      )}

      {/* Notes */}
      {contact.notes && (
        <p className="contact-notes">{contact.notes}</p>
      )}

      {/* Call button */}
      <button className="contact-call-btn" style={{ background: color }} onClick={handleCall}>
        <Icon name="phone" size={15}/>
        Call Now
      </button>
    </div>
  );
}

/* ── Main page ── */
export default function ImportantContacts() {
  const { data: rawContacts, loading } = useSupabaseTable('contacts', q =>
    q.eq('active', true).order('category').order('name')
  );

  const [activeCat, setActiveCat]   = useState('All');
  const [search,    setSearch]      = useState('');

  const contacts = rawContacts.filter(c => {
    const matchCat = activeCat === 'All' || c.category === activeCat;
    const matchSrc = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchCat && matchSrc;
  });

  /* Category counts */
  const counts = rawContacts.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const usedCats = ['All', ...Object.keys(counts)];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Icon name="headphone" size={24}/> Important Contacts</h1>
          <p className="page-subtitle">Building services & emergency numbers</p>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            <Icon name="search" size={15}/>
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Search name, category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      {/* KPI summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top"><div className="kpi-label">Total Contacts</div><div className="kpi-icon"><Icon name="contactBook" size={18}/></div></div>
          <div className="kpi-value">{rawContacts.length}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">Active numbers</span></div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-top"><div className="kpi-label">Categories</div><div className="kpi-icon"><Icon name="filter" size={18}/></div></div>
          <div className="kpi-value">{Object.keys(counts).length}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">Service types</span></div>
        </div>
        <div className="kpi-card kpi-accent">
          <div className="kpi-top"><div className="kpi-label">Showing</div><div className="kpi-icon"><Icon name="eye" size={18}/></div></div>
          <div className="kpi-value">{contacts.length}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">{activeCat === 'All' ? 'All' : activeCat}</span></div>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="contact-cat-tabs">
        {CATEGORIES.filter(c => usedCats.includes(c.label)).map(cat => (
          <button
            key={cat.label}
            className={`contact-cat-tab ${activeCat === cat.label ? 'active' : ''}`}
            onClick={() => setActiveCat(cat.label)}
            style={activeCat === cat.label ? { borderColor: cat.color, color: cat.color, background: cat.color + '15' } : {}}
          >
            <Icon name={cat.icon} size={13}/>
            <span>{cat.label}</span>
            {cat.label !== 'All' && counts[cat.label] && (
              <span className="contact-cat-count">{counts[cat.label]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner lg"/></div>
      ) : contacts.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Icon name="headphone" size={48} className="empty-state-icon"/>
          <h3>No Contacts Found</h3>
          <p>{rawContacts.length === 0 ? 'Admin has not added any contacts yet.' : 'No contacts match your search.'}</p>
        </div>
      ) : (
        <div className="contact-grid">
          {contacts.map(c => <ContactCard key={c.id} contact={c}/>)}
        </div>
      )}
    </div>
  );
}
