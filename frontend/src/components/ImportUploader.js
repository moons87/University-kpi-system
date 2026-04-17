import { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function ImportUploader({ onFile, loading }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = (file) => {
    if (file && file.name.endsWith('.xlsx')) onFile(file);
  };

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current.click()}
      sx={{
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 6,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: dragging ? 'rgba(176,125,42,0.05)' : 'background.paper',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(176,125,42,0.03)' },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={(e) => handle(e.target.files[0])}
      />
      <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body1" color="text.secondary">
        Перетащите .xlsx файл сюда или нажмите для выбора
      </Typography>
      <Typography variant="body2" color="text.disabled" mt={0.5}>
        Поддерживается один файл с листами: Преподаватели, Нагрузка, Публикации, Патенты, Проекты, Достижения
      </Typography>
      {loading && (
        <Typography variant="body2" color="primary" mt={1}>Загрузка...</Typography>
      )}
    </Box>
  );
}
