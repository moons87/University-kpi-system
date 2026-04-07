import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { getTeachers } from '../api/teachers';

const COLUMNS = [
  { field: 'id',        headerName: 'ID',    width: 60 },
  { field: 'full_name', headerName: 'Name',  flex: 1 },
  { field: 'email',     headerName: 'Email', flex: 1 },
];

export default function TeachersPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTeachers().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" mb={2}>Teachers</Typography>
      <DataGrid
        rows={rows}
        columns={[
          ...COLUMNS,
          {
            field: 'actions',
            headerName: '',
            width: 100,
            renderCell: (p) => (
              <Button size="small" onClick={() => navigate(`/teachers/${p.row.id}`)}>View</Button>
            ),
          },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
