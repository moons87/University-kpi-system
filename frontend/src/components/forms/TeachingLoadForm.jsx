import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Select, MenuItem, InputLabel, FormControl,
  TextField,
} from '@mui/material';
import { getTimeDim }         from '../../api/timeDim';
import { getSubjects }        from '../../api/subjects';
import { getGroups }          from '../../api/groups';
import { createTeachingLoad } from '../../api/teachingLoad';
import useFilterStore         from '../../store/filterStore';
import useAuthStore           from '../../store/authStore';

export default function TeachingLoadFormDialog({ open, onClose, onSuccess }) {
  const [periods,  setPeriods]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const timeIdStore = useFilterStore((s) => s.timeId);
  const user        = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({
    subject_id: '', group_id: '', hours: '', time_id: '',
  });

  useEffect(() => {
    getTimeDim().then(setPeriods);
    getSubjects().then(setSubjects);
    getGroups().then(setGroups);
  }, []);

  useEffect(() => {
    if (open) setFormData({ subject_id: '', group_id: '', hours: '', time_id: timeIdStore || '' });
  }, [open, timeIdStore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createTeachingLoad({
      time_id:    formData.time_id,
      subject_id: Number(formData.subject_id),
      group_id:   Number(formData.group_id),
      hours:      Number(formData.hours),
      teacher_id: user.teacher_id,
    })
      .then(() => { onSuccess(); onClose(); })
      .catch(console.error);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Teaching Load</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Period</InputLabel>
            <Select value={formData.time_id} label="Period"
              onChange={(e) => setFormData({ ...formData, time_id: e.target.value })}>
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.year} - Sem {p.semester}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" required>
            <InputLabel>Subject</InputLabel>
            <Select value={formData.subject_id} label="Subject"
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}>
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" required>
            <InputLabel>Group</InputLabel>
            <Select value={formData.group_id} label="Group"
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth margin="dense" label="Hours" type="number" required
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Submit</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
