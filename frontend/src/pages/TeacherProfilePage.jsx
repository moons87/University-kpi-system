import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Chip, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getTeacher } from '../api/teachers';
import { getPublications } from '../api/publications';
import { getProjects }     from '../api/projects';
import { getKPIScores }    from '../api/kpi';

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

  useEffect(() => {
    getTeacher(id).then(setTeacher);
    getPublications({ teacher_id: id }).then(setPublications);
    getProjects({ teacher_id: id }).then(setProjects);
    getKPIScores({ teacher_id: id }).then(setKpiScores);
  }, [id]);

  if (!teacher) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5" mb={1}>{teacher.full_name}</Typography>
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
    </Box>
  );
}
