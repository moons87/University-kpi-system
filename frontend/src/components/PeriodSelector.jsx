import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { getTimeDim } from '../api/timeDim';
import useFilterStore from '../store/filterStore';

/** Returns { year, semester } for the current calendar date.
 *  Sep–Dec  → semester 1, current year
 *  Jan–Jun  → semester 2, current year
 *  Jul–Aug  → semester 2, current year (summer break, still spring term)
 */
function detectCurrentPeriod() {
  const now      = new Date();
  const month    = now.getMonth() + 1; // 1-12
  const year     = now.getFullYear();
  const semester = month >= 9 ? 1 : 2;
  return { year, semester };
}

export default function PeriodSelector() {
  const [periods, setPeriods]  = useState([]);
  const { timeId, setFilter }  = useFilterStore();

  useEffect(() => {
    getTimeDim().then((data) => {
      setPeriods(data);

      // Auto-select the current period if none is chosen yet
      if (!timeId && data.length > 0) {
        const { year, semester } = detectCurrentPeriod();
        const match = data.find((p) => p.year === year && p.semester === semester);
        const fallback = data[data.length - 1]; // latest period
        const target   = match || fallback;
        setFilter(target.id, target.year, target.semester);
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const selected = periods.find((p) => p.id === e.target.value);
    if (selected) setFilter(selected.id, selected.year, selected.semester);
  };

  const semLabel = (s) => (s === 1 ? 'Осенний' : 'Весенний');

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: 210,
        '& .MuiOutlinedInput-root': { fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem' },
        '& .MuiInputLabel-root':    { fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem' },
      }}
    >
      <InputLabel>Период</InputLabel>
      <Select value={timeId || ''} label="Период" onChange={handleChange}>
        {periods.map((p) => (
          <MenuItem
            key={p.id}
            value={p.id}
            sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem' }}
          >
            {p.year} — {semLabel(p.semester)} сем.
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
