import { useState } from 'react';
import { getCurrentMonth, getCurrentYear } from '../utils/formatters';

/**
 * Default month/year filter — always starts at today's calendar month & year.
 * Users can still switch to "All" or another period via MonthYearFilter.
 */
export function usePeriodFilter() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [year, setYear] = useState(getCurrentYear);
  return { month, year, setMonth, setYear };
}

export { getCurrentMonth, getCurrentYear };
