import client from './client';

export const getProjects    = (params) => client.get('/projects/', { params }).then(r => r.data);
export const createProject  = (data)   => client.post('/projects/', data).then(r => r.data);
export const deleteProject  = (id)     => client.delete(`/projects/${id}`);
