import client from './client';

export const getTimeDim    = ()     => client.get('/time-dim/').then(r => r.data);
export const createTimeDim = (data) => client.post('/time-dim/', data).then(r => r.data);
