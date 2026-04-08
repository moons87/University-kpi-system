import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, Tabs, Tab, List, ListItem, ListItemText, Stack,
} from '@mui/material';
import { getSettings, updateSettings } from '../api/settings';
import { getSubjects, createSubject }  from '../api/subjects';
import { getGroups,   createGroup }    from '../api/groups';
import useAuthStore from '../store/authStore';

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

  useEffect(() => {
    if (user?.role !== 'admin') return;

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
    getGroups().then(setGroups).catch(console.error);
  }, [user]);

  if (user?.role !== 'admin') {
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

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="KPI Settings" />
        <Tab label="Subjects" />
        <Tab label="Groups" />
      </Tabs>

      {/* ── KPI Settings Tab ── */}
      {tab === 0 && (
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
                      inputProps={{ step: '0.05' }}
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
      {tab === 1 && (
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
      {tab === 2 && (
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
    </Box>
  );
}
