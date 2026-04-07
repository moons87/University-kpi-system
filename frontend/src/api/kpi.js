import client from './client';

export const getKPIScores  = (params)         => client.get('/kpi/scores', { params }).then(r => r.data);
export const getKPISummary = (time_id)        => client.get('/kpi/summary', { params: { time_id } }).then(r => r.data);
export const calculateKPI  = (year, semester) => client.post('/kpi/calculate', null, { params: { year, semester } }).then(r => r.data);
