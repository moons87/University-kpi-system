import client from './client';

export const getSubjects   = ()     => client.get('/subjects/').then(r => r.data);
export const createSubject = (data) => client.post('/subjects/', data).then(r => r.data);
