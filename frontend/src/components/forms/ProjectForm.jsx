import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { getTimeDim } from '../../api/timeDim';
import { createProject } from '../../api/projects';
import useFilterStore from '../../store/filterStore';
import useAuthStore from '../../store/authStore';

export default function ProjectFormDialog({ open, onClose, onSuccess }) {
  const [periods, setPeriods] = useState([]);
  const timeIdStore = useFilterStore((s) => s.timeId);
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({ title: '', funding_source: '', budget: '', time_id: '', start_date: '', end_date: '' });

  useEffect(() => {
    getTimeDim().then(setPeriods);
  }, []);

  useEffect(() => {
    if (open) setFormData({ title: '', funding_source: '', budget: '', time_id: timeIdStore || '', start_date: '', end_date: '' });
  }, [open, timeIdStore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.time_id) {
      alert("Кезеңді таңдаңыз!");
      return;
    }
    const payload = { 
      ...formData, 
      teacher_id: user.teacher_id, 
      time_id: parseInt(formData.time_id, 10),
      budget: formData.budget ? Number(formData.budget) : null,
      start_date: formData.start_date ? formData.start_date : null,
      end_date: formData.end_date ? formData.end_date : null,
    };
    createProject(payload)
      .then(() => { onSuccess(); onClose(); })
      .catch((err) => {
        console.error(err);
        alert("Сақтауда қате: " + (err.response?.data?.detail || err.message));
      });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Жоба қосу</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Кезең</InputLabel>
            <Select value={formData.time_id} label="Кезең" onChange={(e) => setFormData({ ...formData, time_id: e.target.value })}>
              {periods.map((p) => <MenuItem key={p.id} value={p.id}>{p.year} — Сем {p.semester}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Атауы" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <TextField fullWidth margin="dense" label="Қаржыландыру көзі" value={formData.funding_source} onChange={e => setFormData({ ...formData, funding_source: e.target.value })} />
          <TextField fullWidth margin="dense" label="Бюджет" type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
          <TextField fullWidth margin="dense" label="Басталу күні" type="date" InputLabelProps={{ shrink: true }} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
          <TextField fullWidth margin="dense" label="Аяқталу күні" type="date" InputLabelProps={{ shrink: true }} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Болдырмау</Button>
          <Button type="submit" variant="contained">Жіберу</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
