import client from './client';

export const previewImport = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/import/preview', form).then((r) => r.data);
};

export const confirmImport = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/import/confirm', form).then((r) => r.data);
};
