import { useEffect, useState } from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PeriodSelector from '../components/PeriodSelector';
import { getPatents } from '../api/patents';
import useFilterStore from '../store/filterStore';
import useAuthStore from '../store/authStore';
import PatentFormDialog from '../components/forms/PatentForm';
import ImportDialog from '../components/ImportDialog';

export default function PatentsPage() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [openForm,   setOpenForm]   = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const { timeId } = useFilterStore();
  const user = useAuthStore(s => s.user);

  const loadData = () => {
    setLoading(true);
    const params = timeId ? { time_id: timeId } : {};
    getPatents(params).then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Patents</Typography>
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
          { field: 'teacher_id',          headerName: 'Teacher',             width: 100 },
          { field: 'title',               headerName: 'Title',               flex: 2 },
          { field: 'registration_number', headerName: 'Registration Number', flex: 1 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
      <PatentFormDialog open={openForm} onClose={() => setOpenForm(false)} onSuccess={loadData} />
      <ImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        onSuccess={loadData}
        sheetType="patents"
        title="Импорт патентов"
      />
    </Box>
  );
}
