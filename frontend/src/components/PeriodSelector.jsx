import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { getTimeDim } from '../api/timeDim';
import useFilterStore from '../store/filterStore';

export default function PeriodSelector() {
  const [periods, setPeriods] = useState([]);
  const { timeId, setFilter } = useFilterStore();

  useEffect(() => {
    getTimeDim().then(setPeriods).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const selected = periods.find((p) => p.id === e.target.value);
    if (selected) setFilter(selected.id, selected.year, selected.semester);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Period</InputLabel>
      <Select value={timeId || ''} label="Period" onChange={handleChange}>
        {periods.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.year} — Semester {p.semester}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
