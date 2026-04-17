import { useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import ImportUploader from '../components/ImportUploader';
import ImportPreviewTable from '../components/ImportPreviewTable';
import ImportSummary from '../components/ImportSummary';
import { previewImport, confirmImport } from '../api/import';

export default function ImportPage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const totalImportable = preview
    ? preview.sheets.reduce((sum, s) => sum + s.valid + s.warnings, 0)
    : 0;

  const handleFile = async (f) => {
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const data = await previewImport(f);
      setPreview(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await confirmImport(file);
      setResult(data);
      setPreview(null);
      setFile(null);
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка при импорте');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>Импорт данных</Typography>

      {!preview && !result && (
        <ImportUploader onFile={handleFile} loading={loading} />
      )}

      {error && (
        <Typography color="error" mt={2}>{error}</Typography>
      )}

      {preview && (
        <>
          <ImportPreviewTable preview={preview} />
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="outlined" onClick={handleReset} disabled={loading}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={loading || totalImportable === 0}
            >
              Импортировать {totalImportable} строк
            </Button>
          </Stack>
        </>
      )}

      <ImportSummary result={result} />

      {result && (
        <Button variant="outlined" onClick={handleReset} sx={{ mt: 2 }}>
          Загрузить ещё файл
        </Button>
      )}
    </Box>
  );
}
