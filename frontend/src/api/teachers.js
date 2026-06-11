import client from './client';

export const getTeachers          = (params)   => client.get('/teachers/', { params }).then(r => r.data);
export const getTeacher           = (id)        => client.get(`/teachers/${id}`).then(r => r.data);
export const createTeacher        = (data)      => client.post('/teachers/', data).then(r => r.data);
export const updateTeacher        = (id, data)  => client.put(`/teachers/${id}`, data).then(r => r.data);
export const createTeacherAccount = (id)        => client.post(`/teachers/${id}/create-account`).then(r => r.data);

