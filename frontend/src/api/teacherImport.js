import client from './client';

export const teacherPreviewImport = (file, sheetType) => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/import/teacher/preview?sheet_type=${sheetType}`, form).then(r => r.data);
};

export const teacherConfirmImport = (file, sheetType) => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/import/teacher/confirm?sheet_type=${sheetType}`, form).then(r => r.data);
};
