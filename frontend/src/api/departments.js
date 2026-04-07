import client from './client';

export const getDepartments = () => client.get('/departments/').then(r => r.data);
