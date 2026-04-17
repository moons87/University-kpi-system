import client from './client';

export const previewImport = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/import/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const confirmImport = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/import/confirm', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
