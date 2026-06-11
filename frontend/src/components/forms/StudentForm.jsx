import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, IconButton, Stack,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getGroups }   from '../../api/groups';
import { getSubjects } from '../../api/subjects';

const EDUCATION_LEVELS = [
  { value: 'bachelor',  label: 'Бакалавриат' },
  { value: 'master',    label: 'Магистратура' },
  { value: 'doctoral',  label: 'Докторантура' },
];

const PAYMENT_FORMS = [
  { value: 'grant', label: 'Грант' },
  { value: 'paid',  label: 'Платник' },
];

const GENDERS = [
  { value: 'male',   label: 'Еркек' },
  { value: 'female', label: 'Әйел' },
];

const EMPTY = {
  full_name: '', group_id: '', education_level: 'bachelor',
  enrollment_year: new Date().getFullYear(), origin: '',
  language: '', payment_form: 'grant', gender: '',
  grades: [],
};

export default function StudentForm({ open, onClose, onSave, initial }) {
  const [form,     setForm]     = useState(EMPTY);
  const [groups,   setGroups]   = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!open) return;
    getGroups().then(setGroups).catch(() => {});
    getSubjects().then(setSubjects).catch(() => {});
    setForm(initial
      ? { ...initial, group_id: initial.group_id ?? '', gender: initial.gender ?? '', grades: initial.grades ?? [] }
      : EMPTY
    );
  }, [open, initial]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addGrade = () =>
    setForm(f => ({ ...f, grades: [...f.grades, { subject_id: '', grade: '' }] }));

  const setGrade = (i, key, val) =>
    setForm(f => {
      const grades = [...f.grades];
      grades[i] = { ...grades[i], [key]: val };
      return { ...f, grades };
    });

  const removeGrade = (i) =>
    setForm(f => ({ ...f, grades: f.grades.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    const payload = {
      ...form,
      group_id:        form.group_id        ? Number(form.group_id)        : null,
      enrollment_year: Number(form.enrollment_year),
      gender:          form.gender          || null,
      origin:          form.origin.trim()   || null,
      language:        form.language.trim() || null,
      grades: form.grades
        .filter(g => g.subject_id)
        .map(g => ({ subject_id: Number(g.subject_id), grade: g.grade !== '' ? Number(g.grade) : null })),
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? 'Студентті өңдеу' : 'Студент қосу'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField fullWidth required label="Аты-жөні" size="small"
              value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Топ" size="small"
              value={form.group_id} onChange={e => set('group_id', e.target.value)}>
              <MenuItem value="">— Топсыз —</MenuItem>
              {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth required label="Оқу деңгейі" size="small"
              value={form.education_level} onChange={e => set('education_level', e.target.value)}>
              {EDUCATION_LEVELS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Түскен жылы" size="small" type="number"
              value={form.enrollment_year} onChange={e => set('enrollment_year', e.target.value)}
              slotProps={{ htmlInput: { min: 1990, max: 2100 } }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Қайдан" size="small"
              value={form.origin} onChange={e => set('origin', e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Оқу тілі" size="small"
              value={form.language} onChange={e => set('language', e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth required label="Оқу нысаны" size="small"
              value={form.payment_form} onChange={e => set('payment_form', e.target.value)}>
              {PAYMENT_FORMS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Жынысы" size="small"
              value={form.gender} onChange={e => set('gender', e.target.value)}>
              <MenuItem value="">— Көрсетілмеген —</MenuItem>
              {GENDERS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Пәндер бойынша бағалар
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addGrade}>
                Пән қосу
              </Button>
            </Stack>
            {form.grades.map((g, i) => (
              <Stack key={i} direction="row" spacing={1} mb={1} alignItems="center">
                <TextField select size="small" label="Пән" sx={{ flex: 2 }}
                  value={g.subject_id} onChange={e => setGrade(i, 'subject_id', e.target.value)}>
                  {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Баға" type="number" sx={{ flex: 1 }}
                  value={g.grade} onChange={e => setGrade(i, 'grade', e.target.value)}
                  slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }} />
                <IconButton size="small" onClick={() => removeGrade(i)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Болдырмау</Button>
        <Button variant="contained" onClick={handleSave} disabled={!form.full_name.trim()}>
          Сақтау
        </Button>
      </DialogActions>
    </Dialog>
  );
}
