import { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Alert, LinearProgress, Box,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip,
} from '@mui/material';
import UploadFileIcon  from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { teacherPreviewImport, teacherConfirmImport } from '../api/teacherImport';

const STATUS_COLOR = { ok: 'success', warning: 'warning', error: 'error' };

export default function ImportDialog({ open, onClose, onSuccess, sheetType, title }) {
  const inputRef = useRef(null);
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState('idle');

  const reset = () => {
    setFile(null); setPreview(null); setResult(null);
    setError(''); setStep('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setError(''); setLoading(true);
    try {
      const data = await teacherPreviewImport(f, sheetType);
      setPreview(data.sheets?.[0] ?? null);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка чтения файла');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      const data = await teacherConfirmImport(file, sheetType);
      setResult(data); setStep('done');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  };

  const sheet = preview;
  const previewRows = sheet?.rows?.slice(0, 30) ?? [];
  const cols = previewRows.length > 0 ? Object.keys(previewRows[0].data) : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title ?? 'Импорт из Excel'}</DialogTitle>
      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error   && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {step === 'idle' && (
          <Stack
            alignItems="center" justifyContent="center" spacing={1}
            sx={{ py: 5, border: '2px dashed #e2e8f2', borderRadius: 2, cursor: 'pointer',
                  '&:hover': { borderColor: '#b07d2a' } }}
            onClick={() => inputRef.current?.click()}
          >
            <UploadFileIcon sx={{ fontSize: 44, color: '#c8d0e0' }} />
            <Typography sx={{ fontWeight: 600, color: '#1a2540' }}>Выберите .xlsx файл</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>Нажмите для выбора</Typography>
            <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={handleFileChange} />
          </Stack>
        )}

        {step === 'preview' && sheet && (
          <Box>
            <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
              <Chip label={`Всего: ${sheet.total}`} size="small" />
              <Chip label={`OK: ${sheet.valid}`} size="small" color="success" />
              {sheet.warnings > 0 && <Chip label={`Предупреждений: ${sheet.warnings}`} size="small" color="warning" />}
              {sheet.errors   > 0 && <Chip label={`Ошибок: ${sheet.errors}`}           size="small" color="error"   />}
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#94a3b8', bgcolor: '#f8fafc' }}>Строка</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#94a3b8', bgcolor: '#f8fafc' }}>Статус</TableCell>
                    {cols.map(c => (
                      <TableCell key={c} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#94a3b8', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i} sx={{ bgcolor: r.status === 'error' ? '#fff5f5' : r.status === 'warning' ? '#fffbeb' : 'inherit' }}>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.row}</TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" color={STATUS_COLOR[r.status] ?? 'default'} />
                        {r.message && <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.3 }}>{r.message}</Typography>}
                      </TableCell>
                      {cols.map(c => (
                        <TableCell key={c} sx={{ fontSize: '0.8rem' }}>
                          {r.data[c] === null || r.data[c] === undefined ? '—' : String(r.data[c])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {step === 'done' && result && (
          <Stack alignItems="center" spacing={2} py={3}>
            <CheckCircleIcon sx={{ fontSize: 52, color: '#16a34a' }} />
            <Typography sx={{ fontWeight: 700, color: '#1a2540' }}>Импорт завершён</Typography>
            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#16a34a' }}>
                  {result.imported}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>импортировано</Typography>
              </Box>
              <Box textAlign="center">
                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>
                  {result.skipped}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>пропущено</Typography>
              </Box>
            </Stack>
            {result.details?.map((d, i) => (
              <Typography key={i} sx={{ fontSize: '0.8rem', color: '#64748b' }}>• {d}</Typography>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'idle'    && <Button onClick={handleClose}>Отмена</Button>}
        {step === 'preview' && <>
          <Button onClick={reset} disabled={loading}>Назад</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={loading || (sheet?.valid ?? 0) === 0}>
            Подтвердить импорт ({sheet?.valid ?? 0} строк)
          </Button>
        </>}
        {step === 'done' && <>
          <Button onClick={reset}>Ещё импорт</Button>
          <Button variant="contained" onClick={handleClose}>Закрыть</Button>
        </>}
      </DialogActions>
    </Dialog>
  );
}
