import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { getTeachers, createTeacher, updateTeacher, createTeacherAccount } from '../api/teachers';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const EMPTY_FORM = { full_name: '', email: '', position_id: '', degree_id: '', department_id: '' };

export default function TeachersPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // ── Lookup Data ──
  const [departments, setDepartments] = useState([]);
  const [positions,   setPositions]   = useState([]);
  const [degrees,     setDegrees]     = useState([]);

  // ── Create / Edit dialog ──
  const [formOpen,  setFormOpen]  = useState(false);
  const [editId,    setEditId]    = useState(null);   // null = create mode
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // ── Account credentials dialog ──
  const [credsOpen,    setCredsOpen]    = useState(false);
  const [creds,        setCreds]        = useState(null);
  const [credsLoading, setCredsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getTeachers().then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user?.role === 'admin') {
      client.get('/departments').then(r => setDepartments(r.data)).catch(console.error);
      client.get('/positions').then(r  => setPositions(r.data)).catch(console.error);
      client.get('/degrees').then(r    => setDegrees(r.data)).catch(console.error);
    }
  }, [user]);

  // ── Open edit dialog pre-filled with row data ──
  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      full_name:     row.full_name     || '',
      email:         row.email         || '',
      position_id:   row.position_id   || '',
      degree_id:     row.degree_id     || '',
      department_id: row.department_id || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
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
      if (editId) {
        await updateTeacher(editId, payload);
      } else {
        await createTeacher(payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Оқытушыны сақтауда қате');
    }
  };

  const handleCreateAccount = async (teacherId) => {
    setCredsLoading(true);
    setCreds(null);
    try {
      const result = await createTeacherAccount(teacherId);
      setCreds({ email: result.email, password: result.password });
      setCredsOpen(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Аккаунт жасай алмады');
    } finally {
      setCredsLoading(false);
    }
  };

  const columns = [
    { field: 'id',        headerName: 'ID',                  width: 60 },
    { field: 'full_name', headerName: 'Аты-жөні',           flex: 1 },
    { field: 'email',     headerName: 'Электрондық пошта',  flex: 1 },
    {
      field: 'actions',
      headerName: '',
      width: user?.role === 'admin' ? 310 : 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => navigate(`/teachers/${p.row.id}`)}>Қарау</Button>
          {user?.role === 'admin' && (<>
            <Button
              size="small"
              variant="outlined"
              onClick={() => openEdit(p.row)}
            >
              Өңдеу
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="success"
              disabled={credsLoading}
              onClick={() => handleCreateAccount(p.row.id)}
            >
              Аккаунт
            </Button>
          </>)}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Оқытушылар</Typography>
        {user?.role === 'admin' && (
          <Button variant="contained" onClick={openCreate}>+ Оқытушы қосу</Button>
        )}
      </Stack>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Оқытушыны өңдеу' : 'Жаңа оқытушы қосу'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

            <TextField
              fullWidth margin="dense" label="Толық аты-жөні" required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <TextField
              fullWidth margin="dense" label="Email" type="email"
              required={!editId}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              helperText={!editId ? 'Бұл email кіру үшін пайдаланылады' : ''}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth margin="dense">
              <InputLabel>Кафедра</InputLabel>
              <Select value={form.department_id} label="Кафедра"
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <MenuItem value=""><em>Жоқ</em></MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Лауазым</InputLabel>
              <Select value={form.position_id} label="Лауазым"
                onChange={(e) => setForm({ ...form, position_id: e.target.value })}>
                <MenuItem value=""><em>Жоқ</em></MenuItem>
                {positions.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Ғылыми дәреже</InputLabel>
              <Select value={form.degree_id} label="Ғылыми дәреже"
                onChange={(e) => setForm({ ...form, degree_id: e.target.value })}>
                <MenuItem value=""><em>Жоқ</em></MenuItem>
                {degrees.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Болдырмау</Button>
            <Button type="submit" variant="contained">
              {editId ? 'Өзгерістерді сақтау' : 'Оқытушы жасау'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Credentials Dialog ── */}
      <Dialog open={credsOpen} onClose={() => setCredsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>✅ Аккаунт жасалды</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Аккаунт жасалды! Кіру деректерін оқытушыға жіберіңіз.
          </Alert>
          <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 2 }}>
            <Typography variant="body2" color="text.secondary">Электрондық пошта (Кіру)</Typography>
            <Typography variant="body1" fontWeight="bold" mb={1}>{creds?.email}</Typography>
            <Typography variant="body2" color="text.secondary">Уақытша құпия сөз</Typography>
            <Chip label={creds?.password} color="warning" sx={{ fontFamily: 'monospace', fontSize: '1rem' }} />
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }} icon={false}>
            Оқытушыға алғашқы кіруден кейін құпия сөзді өзгертуді ескертіңіз.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCredsOpen(false)}>Дайын</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
