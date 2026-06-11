import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { getTimeDim } from '../../api/timeDim';
import { createAchievement } from '../../api/achievements';
import useFilterStore from '../../store/filterStore';
import useAuthStore from '../../store/authStore';

export default function AchievementFormDialog({ open, onClose, onSuccess }) {
  const [periods, setPeriods] = useState([]);
  const timeIdStore = useFilterStore((s) => s.timeId);
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({ title: '', level: 'University', time_id: '' });

  useEffect(() => {
    getTimeDim().then(setPeriods);
  }, []);

  useEffect(() => {
    if (open) setFormData({ title: '', level: 'University', time_id: timeIdStore || '' });
  }, [open, timeIdStore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createAchievement({ ...formData, teacher_id: user.teacher_id })
      .then(() => { onSuccess(); onClose(); })
      .catch(console.error);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Жетістік қосу</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Кезең</InputLabel>
            <Select value={formData.time_id} label="Кезең" onChange={(e) => setFormData({ ...formData, time_id: e.target.value })}>
              {periods.map((p) => <MenuItem key={p.id} value={p.id}>{p.year} — Сем {p.semester}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Атауы" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Деңгейі</InputLabel>
            <Select value={formData.level} label="Деңгейі" onChange={e => setFormData({ ...formData, level: e.target.value })}>
              <MenuItem value="university">Университет</MenuItem>
              <MenuItem value="national">Ұлттық</MenuItem>
              <MenuItem value="international">Халықаралық</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Болдырмау</Button>
          <Button type="submit" variant="contained">Жіберу</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
