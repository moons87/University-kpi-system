import { useEffect, useState } from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PeriodSelector from '../components/PeriodSelector';
import { getProjects } from '../api/projects';
import useFilterStore from '../store/filterStore';
import useAuthStore from '../store/authStore';
import ProjectFormDialog from '../components/forms/ProjectForm';
import ImportDialog from '../components/ImportDialog';

export default function ProjectsPage() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [openForm,   setOpenForm]   = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const { timeId } = useFilterStore();
  const user = useAuthStore(s => s.user);

  const loadData = () => {
    setLoading(true);
    const params = timeId ? { time_id: timeId } : {};
    getProjects(params).then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Projects</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {user?.role === 'teacher' && (
            <Button variant="contained" onClick={() => setOpenForm(true)}>Add New</Button>
          )}
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setOpenImport(true)}>
            Импорт
          </Button>
          <PeriodSelector />
        </Stack>
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id',     headerName: 'Teacher',        width: 100 },
          { field: 'title',          headerName: 'Title',          flex: 2 },
          { field: 'funding_source', headerName: 'Funding Source', flex: 1 },
          { field: 'budget',         headerName: 'Budget',         width: 130 },
          { field: 'start_date',     headerName: 'Start',          width: 110 },
          { field: 'end_date',       headerName: 'End',            width: 110 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
      <ProjectFormDialog open={openForm} onClose={() => setOpenForm(false)} onSuccess={loadData} />
      <ImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        onSuccess={loadData}
        sheetType="projects"
        title="Импорт проектов"
      />
    </Box>
  );
}
