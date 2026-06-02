import { MONTHS } from '../../utils/formatters';
import Icon from '../Icon';

export default function MonthYearFilter({
  month,
  year,
  onMonthChange,
  onYearChange,
  years = [2025, 2026, 2027],
  showAllMonths = true,
  showAllYears = true,
}) {
  return (
    <div className="filter-bar" role="group" aria-label="Period filter">
      <Icon name="filter" size={14} style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }} />
      {showAllMonths && (
        <select
          className="form-select"
          value={month}
          onChange={e => onMonthChange(e.target.value)}
          aria-label="Month"
        >
          <option value="All">All Months</option>
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      )}
      {showAllYears && (
        <select
          className="form-select"
          value={year}
          onChange={e => onYearChange(e.target.value === 'All' ? 'All' : Number(e.target.value))}
          aria-label="Year"
        >
          <option value="All">All Years</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}
    </div>
  );
}
