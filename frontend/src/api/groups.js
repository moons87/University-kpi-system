import client from './client';

export const getGroups   = ()     => client.get('/groups/').then(r => r.data);
export const createGroup = (data) => client.post('/groups/', data).then(r => r.data);
