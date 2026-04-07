import client from './client';

export const getPatents    = (params) => client.get('/patents/', { params }).then(r => r.data);
export const createPatent  = (data)   => client.post('/patents/', data).then(r => r.data);
export const deletePatent  = (id)     => client.delete(`/patents/${id}`);
