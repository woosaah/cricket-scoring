import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const auth = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
}

// Players
export const players = {
  getAll: () => api.get('/players'),
  getById: (id: number) => api.get(`/players/${id}`),
  create: (data: any) => api.post('/players', data),
  update: (id: number, data: any) => api.put(`/players/${id}`, data),
  delete: (id: number) => api.delete(`/players/${id}`),
}

// Teams
export const teams = {
  getAll: () => api.get('/teams'),
  getById: (id: number) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  update: (id: number, data: any) => api.put(`/teams/${id}`, data),
  delete: (id: number) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: number, playerId: number) =>
    api.post(`/teams/${teamId}/players`, { player_id: playerId }),
  removePlayer: (teamId: number, playerId: number) =>
    api.delete(`/teams/${teamId}/players/${playerId}`),
}

// Tournaments
export const tournaments = {
  getAll: () => api.get('/tournaments'),
  getById: (id: number) => api.get(`/tournaments/${id}`),
  create: (data: any) => api.post('/tournaments', data),
  update: (id: number, data: any) => api.put(`/tournaments/${id}`, data),
  delete: (id: number) => api.delete(`/tournaments/${id}`),
  addTeam: (tournamentId: number, teamId: number) =>
    api.post(`/tournaments/${tournamentId}/teams`, { team_id: teamId }),
  getLeaderboards: (id: number) => api.get(`/tournaments/${id}/leaderboards`),
}

// Matches
export const matches = {
  getAll: (tournamentId?: number) =>
    api.get('/matches', { params: { tournament_id: tournamentId } }),
  getById: (id: number) => api.get(`/matches/${id}`),
  create: (data: any) => api.post('/matches', data),
  update: (id: number, data: any) => api.put(`/matches/${id}`, data),
  recordToss: (id: number, data: any) => api.post(`/matches/${id}/toss`, data),
  getScorecard: (id: number) => api.get(`/matches/${id}/scorecard`),
}

// Scoring
export const scoring = {
  startInnings: (data: any) => api.post('/scoring/innings', data),
  startOver: (data: any) => api.post('/scoring/overs', data),
  recordBall: (data: any) => api.post('/scoring/balls', data),
  getInningsState: (inningsId: number) =>
    api.get(`/scoring/innings/${inningsId}/state`),
  undoBall: (ballId: number) => api.delete(`/scoring/balls/${ballId}`),
  endInnings: (inningsId: number) =>
    api.put(`/scoring/innings/${inningsId}/end`),
}

// Analytics
export const analytics = {
  getWormGraph: (matchId: number) => api.get(`/analytics/match/${matchId}/worm-graph`),
  getManhattan: (inningsId: number) => api.get(`/analytics/innings/${inningsId}/manhattan`),
  getPartnerships: (inningsId: number) => api.get(`/analytics/innings/${inningsId}/partnerships`),
  getPlayerForm: (playerId: number) => api.get(`/analytics/player/${playerId}/form`),
}

export default api
