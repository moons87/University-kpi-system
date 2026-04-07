import client from './client';

export const getAchievements    = (params) => client.get('/achievements/', { params }).then(r => r.data);
export const createAchievement  = (data)   => client.post('/achievements/', data).then(r => r.data);
export const deleteAchievement  = (id)     => client.delete(`/achievements/${id}`);
