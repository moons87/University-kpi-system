import { useState, useRef } from 'react';
import {
  Box, Typography, Button, Stack, Alert, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { previewImport, confirmImport } from '../api/import';

export default function ImportPage() {
  const inputRef = useRef(null);
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [step,     setStep]     = useState('select'); // select | preview | done

  const reset = () => {
    setFile(null); setPreview(null); setResult(null);
    setError(''); setStep('select');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    setLoading(true);
    try {
      const data = await previewImport(f);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.detail || 'Файлды оқуда қате');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await confirmImport(file);
      setResult(data);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'Импорттауда қате');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 700, color: '#1a2540', lineHeight: 1.1 }}>
            Деректерді импорттау
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mt: 0.25 }}>
            Excel (.xlsx) файлынан деректерді жүктеу
          </Typography>
        </Box>
        {step !== 'select' && (
          <Button variant="outlined" size="small" onClick={reset}>Жаңа импорт</Button>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
      {error   && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Step 1: file select */}
      {step === 'select' && (
        <Paper
          variant="outlined"
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed #e2e8f2', borderRadius: 3, p: 6,
            textAlign: 'center', cursor: 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: '#b07d2a' },
          }}
        >
          <UploadFileIcon sx={{ fontSize: 48, color: '#c8d0e0', mb: 1 }} />
          <Typography sx={{ fontWeight: 600, color: '#1a2540', mb: 0.5 }}>
            Файлды таңдау үшін басыңыз
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            .xlsx форматы қолданылады
          </Typography>
          <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={handleFileChange} />
        </Paper>
      )}

      {/* Step 2: preview */}
      {step === 'preview' && preview && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Парақ саны: <strong>{preview.sheets?.length ?? 0}</strong>. Деректерді тексеріп, импортты растаңыз.
          </Alert>

          {preview.sheets?.map((sheet, si) => (
            <Box key={si} mb={4}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                <Typography sx={{ fontWeight: 700, color: '#1a2540', fontSize: '0.95rem' }}>
                  {sheet.sheet_name}
                </Typography>
                <Chip label={`${sheet.rows?.length ?? 0} жол`} size="small" />
                {sheet.entity_type && <Chip label={sheet.entity_type} size="small" color="primary" />}
              </Stack>

              {sheet.rows?.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {Object.keys(sheet.rows[0]).map((col) => (
                          <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', bgcolor: '#f8fafc' }}>
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sheet.rows.slice(0, 50).map((row, ri) => (
                        <TableRow key={ri} hover>
                          {Object.values(row).map((val, vi) => (
                            <TableCell key={vi} sx={{ fontSize: '0.82rem' }}>
                              {val === null || val === undefined ? '—' : String(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {si < preview.sheets.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}

          <Stack direction="row" spacing={2} mt={2}>
            <Button variant="contained" onClick={handleConfirm} disabled={loading}>
              Импортты растау
            </Button>
            <Button variant="outlined" onClick={reset} disabled={loading}>
              Болдырмау
            </Button>
          </Stack>
        </Box>
      )}

      {/* Step 3: done */}
      {step === 'done' && result && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: '#16a34a', mb: 1 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a2540', mb: 1 }}>
            Импорт аяқталды
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center" mb={3}>
            <Box>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#16a34a' }}>
                {result.imported}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                импортталды
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>
                {result.skipped}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                өткізіп жіберілді
              </Typography>
            </Box>
          </Stack>

          {result.details?.length > 0 && (
            <Box sx={{ textAlign: 'left', maxWidth: 500, mx: 'auto', mb: 3 }}>
              {result.details.map((d, i) => (
                <Typography key={i} sx={{ fontSize: '0.82rem', color: '#64748b', mb: 0.5 }}>• {d}</Typography>
              ))}
            </Box>
          )}

          <Button variant="contained" onClick={reset}>Тағы импорттау</Button>
        </Paper>
      )}
    </Box>
  );
}
