import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { getTimeDim } from '../../api/timeDim';
import { createPatent } from '../../api/patents';
import useFilterStore from '../../store/filterStore';
import useAuthStore from '../../store/authStore';

export default function PatentFormDialog({ open, onClose, onSuccess }) {
  const [periods, setPeriods] = useState([]);
  const timeIdStore = useFilterStore((s) => s.timeId);
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({ title: '', registration_number: '', time_id: '' });

  useEffect(() => {
    getTimeDim().then(setPeriods);
  }, []);

  useEffect(() => {
    if (open) setFormData({ title: '', registration_number: '', time_id: timeIdStore || '' });
  }, [open, timeIdStore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createPatent({ ...formData, teacher_id: user.teacher_id })
      .then(() => { onSuccess(); onClose(); })
      .catch(console.error);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Патент қосу</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Кезең</InputLabel>
            <Select value={formData.time_id} label="Кезең" onChange={(e) => setFormData({ ...formData, time_id: e.target.value })}>
              {periods.map((p) => <MenuItem key={p.id} value={p.id}>{p.year} — Сем {p.semester}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Атауы" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <TextField fullWidth margin="dense" label="Тіркеу нөмірі" value={formData.registration_number} onChange={e => setFormData({ ...formData, registration_number: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Болдырмау</Button>
          <Button type="submit" variant="contained">Жіберу</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
