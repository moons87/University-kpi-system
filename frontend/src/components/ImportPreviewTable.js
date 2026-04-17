import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const STATUS_COLOR = { ok: 'success', warning: 'warning', error: 'error' };
const STATUS_LABEL = { ok: 'OK', warning: 'Предупреждение', error: 'Ошибка' };

function SheetTable({ sheet }) {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600} mr={2}>{sheet.sheet}</Typography>
        <Chip label={`✅ ${sheet.valid}`} color="success" size="small" sx={{ mr: 0.5 }} />
        <Chip label={`⚠️ ${sheet.warnings}`} color="warning" size="small" sx={{ mr: 0.5 }} />
        <Chip label={`❌ ${sheet.errors}`} color="error" size="small" />
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell width={60}>Строка</TableCell>
              <TableCell width={140}>Статус</TableCell>
              <TableCell>Сообщение / Данные</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sheet.rows.map((row) => (
              <TableRow
                key={row.row}
                sx={{
                  bgcolor:
                    row.status === 'error'   ? 'rgba(220,38,38,0.05)'  :
                    row.status === 'warning' ? 'rgba(217,119,6,0.05)'  : 'transparent',
                }}
              >
                <TableCell>{row.row}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABEL[row.status]}
                    color={STATUS_COLOR[row.status]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {row.message || JSON.stringify(row.data)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ImportPreviewTable({ preview }) {
  if (!preview) return null;
  return (
    <Box mt={3}>
      {preview.sheets.map((sheet) => (
        <SheetTable key={sheet.sheet} sheet={sheet} />
      ))}
    </Box>
  );
}
