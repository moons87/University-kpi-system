import { useEffect, useState } from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PeriodSelector from '../components/PeriodSelector';
import { getTeachingLoad } from '../api/teachingLoad';
import useFilterStore from '../store/filterStore';
import useAuthStore from '../store/authStore';
import TeachingLoadFormDialog from '../components/forms/TeachingLoadForm';
import ImportDialog from '../components/ImportDialog';

export default function TeachingLoadPage() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [openForm,   setOpenForm]   = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const { timeId } = useFilterStore();
  const user = useAuthStore(s => s.user);

  const loadData = () => {
    setLoading(true);
    const params = timeId ? { time_id: timeId } : {};
    getTeachingLoad(params).then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Оқу жүктемесі</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {user?.role === 'teacher' && (
            <Button variant="contained" onClick={() => setOpenForm(true)}>Жаңа жазба</Button>
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
          { field: 'teacher_id', headerName: 'Оқытушы ID', width: 110 },
          { field: 'subject_id', headerName: 'Пән ID',     width: 110 },
          { field: 'group_id',   headerName: 'Топ ID',     width: 100 },
          { field: 'time_id',    headerName: 'Кезең ID',   width: 100 },
          { field: 'hours',      headerName: 'Сағат',      width: 90 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
      <TeachingLoadFormDialog open={openForm} onClose={() => setOpenForm(false)} onSuccess={loadData} />
      <ImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        onSuccess={loadData}
        sheetType="teaching_load"
        title="Жүктемені импорттау"
      />
    </Box>
  );
}
