import client from './client';

export const getTimeDim = () => client.get('/time-dim/').then(r => r.data);
