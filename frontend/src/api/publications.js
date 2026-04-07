import client from './client';

export const getPublications    = (params) => client.get('/publications/', { params }).then(r => r.data);
export const createPublication  = (data)   => client.post('/publications/', data).then(r => r.data);
export const deletePublication  = (id)     => client.delete(`/publications/${id}`);
