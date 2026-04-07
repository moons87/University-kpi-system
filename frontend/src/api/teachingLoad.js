import client from './client';

export const getTeachingLoad    = (params) => client.get('/teaching-load/', { params }).then(r => r.data);
export const createTeachingLoad = (data)   => client.post('/teaching-load/', data).then(r => r.data);
export const deleteTeachingLoad = (id)     => client.delete(`/teaching-load/${id}`);
