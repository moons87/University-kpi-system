import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, Chip, Stack, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getTeacher, updateTeacher } from '../api/teachers';
import { getPublications } from '../api/publications';
import { getProjects }     from '../api/projects';
import { getKPIScores }    from '../api/kpi';
import client from '../api/client';
import useAuthStore from '../store/authStore';

function TabPanel({ value, index, children }) {
  return value === index ? <Box mt={2}>{children}</Box> : null;
}

export default function TeacherProfilePage() {
  const { id }    = useParams();
  const [teacher,      setTeacher]      = useState(null);
  const [publications, setPublications] = useState([]);
  const [projects,     setProjects]     = useState([]);
  const [kpiScores,    setKpiScores]    = useState([]);
  const [tab, setTab] = useState(0);

  const user = useAuthStore((s) => s.user);

  // Lookup data for the edit form
  const [departments, setDepartments] = useState([]);
  const [positions,   setPositions]   = useState([]);
  const [degrees,     setDegrees]     = useState([]);

  // Edit dialog state
  const [formOpen,  setFormOpen]  = useState(false);
  const [form,      setForm]      = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getTeacher(id).then(setTeacher);
    getPublications({ teacher_id: id }).then(setPublications);
    getProjects({ teacher_id: id }).then(setProjects);
    getKPIScores({ teacher_id: id }).then(setKpiScores);
    client.get('/departments').then(r => setDepartments(r.data)).catch(console.error);
    client.get('/positions').then(r  => setPositions(r.data)).catch(console.error);
    client.get('/degrees').then(r    => setDegrees(r.data)).catch(console.error);
  }, [id]);

  const canEdit = user?.role === 'admin' || String(user?.teacher_id) === String(id);

  const openEdit = () => {
    setForm({
      full_name:     teacher.full_name     || '',
      email:         teacher.email         || '',
      position_id:   teacher.position_id   || '',
      degree_id:     teacher.degree_id     || '',
      department_id: teacher.department_id || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = { ...form };
    if (!payload.position_id)   payload.position_id = null;
    if (!payload.degree_id)     payload.degree_id = null;
    if (!payload.department_id) payload.department_id = null;
    try {
      await updateTeacher(id, payload);
      const updated = await getTeacher(id);
      setTeacher(updated);
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error saving profile');
    }
  };

  if (!teacher) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h5">{teacher.full_name}</Typography>
        {canEdit && (
          <Button variant="outlined" onClick={openEdit}>Редактировать профиль</Button>
        )}
      </Stack>
      <Stack direction="row" spacing={1} mb={3}>
        {teacher.position   && <Chip label={teacher.position?.name}   />}
        {teacher.degree     && <Chip label={teacher.degree?.name}     color="primary" />}
        {teacher.department && <Chip label={teacher.department?.name} color="secondary" />}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Publications" />
        <Tab label="Projects" />
        <Tab label="KPI History" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <DataGrid rows={publications} columns={[
          { field: 'title',    headerName: 'Title',    flex: 2 },
          { field: 'type',     headerName: 'Type',     width: 100 },
          { field: 'quartile', headerName: 'Quartile', width: 100 },
        ]} autoHeight pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <DataGrid rows={projects} columns={[
          { field: 'title',          headerName: 'Title',          flex: 2 },
          { field: 'funding_source', headerName: 'Funding Source', flex: 1 },
          { field: 'budget',         headerName: 'Budget',         width: 130 },
        ]} autoHeight pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <DataGrid rows={kpiScores} columns={[
          { field: 'time_id',           headerName: 'Period',       width: 100 },
          { field: 'teaching_score',    headerName: 'Teaching',     width: 110 },
          { field: 'research_score',    headerName: 'Research',     width: 110 },
          { field: 'project_score',     headerName: 'Projects',     width: 110 },
          { field: 'achievement_score', headerName: 'Achievements', width: 130 },
          { field: 'total_score',       headerName: 'Total',        width: 100 },
        ]} autoHeight pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </TabPanel>
      {/* ── Edit Profile Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Редактировать профиль</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

            <TextField
              fullWidth margin="dense" label="ФИО" required
              value={form.full_name || ''}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <TextField
              fullWidth margin="dense" label="Email" type="email" required
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth margin="dense">
              <InputLabel>Кафедра</InputLabel>
              <Select value={form.department_id || ''} label="Кафедра"
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <MenuItem value=""><em>Не выбрано</em></MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Должность</InputLabel>
              <Select value={form.position_id || ''} label="Должность"
                onChange={(e) => setForm({ ...form, position_id: e.target.value })}>
                <MenuItem value=""><em>Не выбрано</em></MenuItem>
                {positions.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Учёная степень</InputLabel>
              <Select value={form.degree_id || ''} label="Учёная степень"
                onChange={(e) => setForm({ ...form, degree_id: e.target.value })}>
                <MenuItem value=""><em>Не выбрано</em></MenuItem>
                {degrees.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained">Сохранить</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
