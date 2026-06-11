import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Chip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StudentForm from '../components/forms/StudentForm';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api/students';
import useAuthStore from '../store/authStore';

const LEVEL_LABEL  = { bachelor: 'Бакалавриат', master: 'Магистратура', doctoral: 'Докторантура' };
const PAY_LABEL    = { grant: 'Грант', paid: 'Ақылы' };
const GENDER_LABEL = { male: 'Е', female: 'Ә' };

export default function StudentsPage() {
  const user    = useAuthStore(s => s.user);
  const canEdit = user?.role === 'admin' || user?.role === 'advisor';

  const [students, setStudents] = useState([]);
  const [error,    setError]    = useState('');
  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState(null);

  const load = () => getStudents().then(setStudents).catch(() => setError('Жүктеуде қате'));

  useEffect(() => { load(); }, []);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateStudent(editing.id, payload);
      } else {
        await createStudent(payload);
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Сақтауда қате');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Студентті жою керек пе?')) return;
    try {
      await deleteStudent(id);
      load();
    } catch {
      setError('Жоюда қате');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 700, color: '#1a2540', lineHeight: 1.1 }}>
            Студенттер
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mt: 0.25 }}>
            Студенттерді және үлгерімді басқару
          </Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true); }}>
            Студент қосу
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Аты-жөні</TableCell>
              <TableCell>Деңгейі</TableCell>
              <TableCell>Түскен жылы</TableCell>
              <TableCell>Қайдан</TableCell>
              <TableCell>Тіл</TableCell>
              <TableCell>Нысаны</TableCell>
              <TableCell>Жынысы</TableCell>
              <TableCell>Бағалар</TableCell>
              {canEdit && <TableCell align="right">Әрекеттер</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#94a3b8', fontSize: '0.85rem' }}>
                  Студенттер әлі жоқ
                </TableCell>
              </TableRow>
            )}
            {students.map(s => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{s.full_name}</TableCell>
                <TableCell>
                  <Chip label={LEVEL_LABEL[s.education_level] ?? s.education_level} size="small" />
                </TableCell>
                <TableCell>{s.enrollment_year}</TableCell>
                <TableCell>{s.origin ?? '—'}</TableCell>
                <TableCell>{s.language ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={PAY_LABEL[s.payment_form] ?? s.payment_form}
                    size="small"
                    color={s.payment_form === 'grant' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>{GENDER_LABEL[s.gender] ?? '—'}</TableCell>
                <TableCell>{s.grades?.length ?? 0}</TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <Tooltip title="Өңдеу">
                      <IconButton size="small" onClick={() => { setEditing(s); setOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Жою">
                      <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <StudentForm open={open} onClose={() => { setOpen(false); setEditing(null); }} onSave={handleSave} initial={editing} />
    </Box>
  );
}
