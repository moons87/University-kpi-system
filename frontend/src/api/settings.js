import client from './client';

export const getSettings = () => client.get('/settings/').then(r => r.data);
export const updateSettings = (data) => client.put('/settings/', data).then(r => r.data);
