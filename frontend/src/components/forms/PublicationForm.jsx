import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { getTimeDim } from '../../api/timeDim';
import { createPublication } from '../../api/publications';
import useFilterStore from '../../store/filterStore';
import useAuthStore from '../../store/authStore';

export default function PublicationFormDialog({ open, onClose, onSuccess }) {
  const [periods, setPeriods] = useState([]);
  const timeIdStore = useFilterStore((s) => s.timeId);
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({ title: '', type: 'Scopus', quartile: '', time_id: '' });

  useEffect(() => {
    getTimeDim().then(setPeriods);
  }, []);

  useEffect(() => {
    if (open) {
      setFormData({ title: '', type: 'Scopus', quartile: '', time_id: timeIdStore || '' });
    }
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
      quartile: formData.quartile ? formData.quartile : null
    };

    createPublication(payload)
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch((err) => {
        console.error(err);
        alert("Сақтауда қате: " + (err.response?.data?.detail || err.message));
      });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Жарияланым қосу</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Кезең</InputLabel>
            <Select
              value={formData.time_id}
              label="Кезең"
              onChange={(e) => setFormData({ ...formData, time_id: e.target.value })}
            >
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.year} — Сем {p.semester}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Атауы" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Түрі</InputLabel>
            <Select value={formData.type} label="Түрі" onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <MenuItem value="Scopus">Scopus</MenuItem>
              <MenuItem value="WoS">WoS</MenuItem>
              <MenuItem value="КОКСНВО">КОКСНВО</MenuItem>
              <MenuItem value="Вестник">Вестник</MenuItem>
              <MenuItem value="Конференция">Конференция</MenuItem>
              <MenuItem value="Международная конференция">Международная конференция</MenuItem>
              <MenuItem value="Монография">Монография</MenuItem>
              <MenuItem value="Учебное пособие">Учебное пособие</MenuItem>
              <MenuItem value="Зарубежные журналы">Зарубежные журналы</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Квартиль" value={formData.quartile} onChange={e => setFormData({ ...formData, quartile: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Болдырмау</Button>
          <Button type="submit" variant="contained">Жіберу</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
