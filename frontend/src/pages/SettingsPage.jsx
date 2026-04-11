import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, Tabs, Tab, List, ListItem, ListItemText, Stack,
} from '@mui/material';
import { getSettings, updateSettings }   from '../api/settings';
import { getSubjects, createSubject }    from '../api/subjects';
import { getGroups,   createGroup }      from '../api/groups';
import { getTimeDim,  createTimeDim }    from '../api/timeDim';
import useAuthStore from '../store/authStore';

/** Detects what the current academic semester should be */
function detectCurrentPeriod() {
  const now      = new Date();
  const month    = now.getMonth() + 1;
  const year     = now.getFullYear();
  const semester = month >= 9 ? 1 : 2;
  return { year, semester };
}

const DEFAULT_WEIGHTS = {
  teaching: 0.30, research: 0.35, project: 0.15, achievement: 0.20,
};

const DEFAULT_MAX_VALUES = {
  hours_total: 300, scopus_wos_count: 5, local_count: 10, patent_count: 3,
  project_count: 3, project_budget: 10000000,
  achievement_intl: 2, achievement_natl: 4, achievement_local: 6,
};

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin   = user?.role === 'admin';
  const isAdvisor = user?.role === 'advisor';
  const [tab, setTab] = useState(0);

  // ── KPI Settings ──
  const [formData, setFormData] = useState({});
  const [kpiMessage, setKpiMessage] = useState('');

  // ── Subjects ──
  const [subjects,     setSubjects]     = useState([]);
  const [newSubject,   setNewSubject]   = useState('');
  const [subjectError, setSubjectError] = useState('');

  // ── Groups ──
  const [groups,     setGroups]     = useState([]);
  const [newGroup,   setNewGroup]   = useState({ name: '', education_level: '' });
  const [groupError, setGroupError] = useState('');

  // ── Periods ──
  const [periods,      setPeriods]      = useState([]);
  const [newPeriod,    setNewPeriod]    = useState(() => detectCurrentPeriod());
  const [periodError,  setPeriodError]  = useState('');
  const [periodMsg,    setPeriodMsg]    = useState('');

  useEffect(() => {
    if (!isAdmin && !isAdvisor) return;

    if (isAdmin) {
      getSettings().then((data) => {
        const dbSettings = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        const merged = {};
        Object.keys(DEFAULT_WEIGHTS).forEach((k) => {
          merged[`weight_${k}`] = dbSettings[`weight_${k}`] ?? DEFAULT_WEIGHTS[k];
        });
        Object.keys(DEFAULT_MAX_VALUES).forEach((k) => {
          merged[`max_${k}`] = dbSettings[`max_${k}`] ?? DEFAULT_MAX_VALUES[k];
        });
        setFormData(merged);
      });
      getSubjects().then(setSubjects).catch(console.error);
      getTimeDim().then(setPeriods).catch(console.error);
    }

    getGroups().then(setGroups).catch(console.error);
  }, [user, isAdmin, isAdvisor]);

  if (!isAdmin && !isAdvisor) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Access Denied</Typography>
      </Box>
    );
  }

  const handleKpiChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: Number(val) }));
  };

  const handleKpiSave = () => {
    updateSettings({ settings: formData })
      .then(() => setKpiMessage('Settings saved successfully. Recalculate KPIs for the new values to take effect.'))
      .catch((err) => setKpiMessage('Error saving settings: ' + err.message));
  };

  const handleAddSubject = () => {
    setSubjectError('');
    if (!newSubject.trim()) { setSubjectError('Subject name is required'); return; }
    createSubject({ name: newSubject.trim() })
      .then((created) => {
        setSubjects((prev) => [...prev, created]);
        setNewSubject('');
      })
      .catch((err) => setSubjectError(err.response?.data?.detail || 'Error creating subject'));
  };

  const handleAddPeriod = () => {
    setPeriodError('');
    setPeriodMsg('');
    const year     = Number(newPeriod.year);
    const semester = Number(newPeriod.semester);
    if (!year || year < 2000 || year > 2100) { setPeriodError('Введите корректный год'); return; }
    if (semester !== 1 && semester !== 2)     { setPeriodError('Семестр: 1 или 2');       return; }
    createTimeDim({ year, semester })
      .then((created) => {
        setPeriods((prev) => [...prev, created].sort((a, b) => a.year - b.year || a.semester - b.semester));
        setPeriodMsg(`Период ${year} — Семестр ${semester} добавлен`);
        setNewPeriod(detectCurrentPeriod());
      })
      .catch((err) => setPeriodError(err.response?.data?.detail || 'Период уже существует или ошибка сервера'));
  };

  const handleAddGroup = () => {
    setGroupError('');
    if (!newGroup.name.trim()) { setGroupError('Group name is required'); return; }
    createGroup({
      name: newGroup.name.trim(),
      education_level: newGroup.education_level.trim() || null,
    })
      .then((created) => {
        setGroups((prev) => [...prev, created]);
        setNewGroup({ name: '', education_level: '' });
      })
      .catch((err) => setGroupError(err.response?.data?.detail || 'Error creating group'));
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Settings</Typography>

      {isAdmin ? (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="KPI Settings" />
          <Tab label="Subjects" />
          <Tab label="Groups" />
          <Tab label="Периоды" />
        </Tabs>
      ) : (
        <Tabs value={0} sx={{ mb: 3 }}>
          <Tab label="Groups" />
        </Tabs>
      )}

      {/* ── KPI Settings Tab ── */}
      {isAdmin && tab === 0 && (
        <>
          {kpiMessage && (
            <Alert severity={kpiMessage.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
              {kpiMessage}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Category Weights</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>Must sum to 1.0 (100%)</Typography>
                  {Object.keys(DEFAULT_WEIGHTS).map((k) => (
                    <TextField
                      key={`weight_${k}`}
                      fullWidth margin="dense"
                      label={`Weight: ${k}`}
                      type="number"
                      slotProps={{ htmlInput: { step: '0.05' } }}
                      value={formData[`weight_${k}`] ?? ''}
                      onChange={(e) => handleKpiChange(`weight_${k}`, e.target.value)}
                    />
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Max Values</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>Ceiling limits for 100% score</Typography>
                  {Object.keys(DEFAULT_MAX_VALUES).map((k) => (
                    <TextField
                      key={`max_${k}`}
                      fullWidth margin="dense"
                      label={`Max: ${k}`}
                      type="number"
                      value={formData[`max_${k}`] ?? ''}
                      onChange={(e) => handleKpiChange(`max_${k}`, e.target.value)}
                    />
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box mt={3} sx={{ textAlign: 'right' }}>
            <Button variant="contained" size="large" onClick={handleKpiSave}>Save Settings</Button>
          </Box>
        </>
      )}

      {/* ── Subjects Tab ── */}
      {isAdmin && tab === 1 && (
        <Box>
          <Typography variant="h6" mb={2}>Subjects</Typography>
          {subjectError && <Alert severity="error" sx={{ mb: 2 }}>{subjectError}</Alert>}
          <Stack direction="row" spacing={2} mb={3} alignItems="center">
            <TextField
              label="Subject name" size="small"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            />
            <Button variant="contained" onClick={handleAddSubject}>Add</Button>
          </Stack>
          <List dense>
            {subjects.map((s) => (
              <ListItem key={s.id}>
                <ListItemText primary={s.name} secondary={`ID: ${s.id}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* ── Groups Tab ── */}
      {(isAdmin ? tab === 2 : true) && (
        <Box>
          <Typography variant="h6" mb={2}>Groups</Typography>
          {groupError && <Alert severity="error" sx={{ mb: 2 }}>{groupError}</Alert>}
          <Stack direction="row" spacing={2} mb={3} alignItems="center">
            <TextField
              label="Group name" size="small" required
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <TextField
              label="Education level (optional)" size="small"
              value={newGroup.education_level}
              onChange={(e) => setNewGroup({ ...newGroup, education_level: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            />
            <Button variant="contained" onClick={handleAddGroup}>Add</Button>
          </Stack>
          <List dense>
            {groups.map((g) => (
              <ListItem key={g.id}>
                <ListItemText
                  primary={g.name}
                  secondary={g.education_level ? `${g.education_level} · ID: ${g.id}` : `ID: ${g.id}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      {/* ── Periods Tab ── */}
      {isAdmin && tab === 3 && (
        <Box>
          <Typography variant="h6" mb={0.5}>Учебные периоды</Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Добавьте период вручную или используйте кнопку для автоматического определения текущего семестра.
          </Typography>

          {periodError && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setPeriodError('')}>{periodError}</Alert>}
          {periodMsg   && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPeriodMsg('')}>{periodMsg}</Alert>}

          <Stack direction="row" spacing={2} mb={1} alignItems="center" flexWrap="wrap">
            <TextField
              label="Год" size="small"
              type="number"
              value={newPeriod.year}
              onChange={(e) => setNewPeriod((p) => ({ ...p, year: e.target.value }))}
              sx={{ width: 120 }}
              slotProps={{ htmlInput: { min: 2000, max: 2100 } }}
            />
            <TextField
              label="Семестр" size="small"
              type="number"
              value={newPeriod.semester}
              onChange={(e) => setNewPeriod((p) => ({ ...p, semester: e.target.value }))}
              sx={{ width: 120 }}
              slotProps={{ htmlInput: { min: 1, max: 2 } }}
            />
            <Button variant="contained" onClick={handleAddPeriod}>Добавить</Button>
            <Button
              variant="outlined"
              onClick={() => setNewPeriod(detectCurrentPeriod())}
              size="small"
            >
              Текущий период
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.75rem' }}>
            Текущий период определяется автоматически: сентябрь–декабрь → Семестр 1, январь–август → Семестр 2.
          </Typography>

          <List dense>
            {periods.map((p) => (
              <ListItem key={p.id}>
                <ListItemText
                  primary={`${p.year} — Семестр ${p.semester === 1 ? '1 (Осенний)' : '2 (Весенний)'}`}
                  secondary={`ID: ${p.id}`}
                />
              </ListItem>
            ))}
            {periods.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                Периодов пока нет. Добавьте первый период.
              </Typography>
            )}
          </List>
        </Box>
      )}
    </Box>
  );
}
