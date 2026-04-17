import client from './client';

export const getGroups    = ()           => client.get('/groups/').then(r => r.data);
export const createGroup  = (data)       => client.post('/groups/', data).then(r => r.data);
export const updateGroup  = (id, data)   => client.patch(`/groups/${id}`, data).then(r => r.data);
export const getAdvisors  = ()           => client.get('/groups/advisors').then(r => r.data);
