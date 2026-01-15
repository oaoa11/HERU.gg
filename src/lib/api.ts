import { projectId, publicAnonKey } from '/utils/supabase/info';
import type { APIResponse } from '@/types';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-6b1cd74f`;

class APIClient {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const session = localStorage.getItem('sb-access-token');
      if (session) {
        headers['Authorization'] = `Bearer ${session}`;
      }
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth = true
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(requireAuth),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`API Error [${endpoint}]:`, data);
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
          ...data,
        };
      }

      return data;
    } catch (error) {
      console.error(`API Request Failed [${endpoint}]:`, error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // ========== Auth ==========
  async signup(email: string, password: string, role: string, display_name: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, display_name }),
    }, false);
  }

  // ========== Users ==========
  async getMyProfile() {
    return this.request('/users/me', { method: 'GET' });
  }

  async updateMyProfile(updates: any) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUserProfile(id: string) {
    return this.request(`/users/${id}`, { method: 'GET' }, false);
  }

  // ========== Gamification ==========
  async getXPHistory() {
    return this.request('/gamification/xp', { method: 'GET' });
  }

  async getLeaderboard() {
    return this.request('/gamification/leaderboard', { method: 'GET' }, false);
  }

  async getLevelProgress() {
    return this.request('/gamification/level-progress', { method: 'GET' });
  }

  // ========== Tournaments ==========
  async getTournaments(filters: { status?: string; game?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.game) params.append('game', filters.game);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/tournaments${query}`, { method: 'GET' }, false);
  }

  async getTournament(id: string) {
    return this.request(`/tournaments/${id}`, { method: 'GET' }, false);
  }

  async createTournament(data: any) {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTournament(id: string, updates: any) {
    return this.request(`/tournaments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async publishTournament(id: string) {
    return this.request(`/tournaments/${id}/publish`, {
      method: 'POST',
    });
  }

  async joinTournament(id: string) {
    return this.request(`/tournaments/${id}/join`, {
      method: 'POST',
    });
  }

  // ========== Teams ==========
  async createTeam(data: any) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTeam(id: string) {
    return this.request(`/teams/${id}`, { method: 'GET' }, false);
  }

  // ========== Notifications ==========
  async getNotifications() {
    return this.request('/notifications', { method: 'GET' });
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // ========== Admin ==========
  async getAllUsers() {
    return this.request('/admin/users', { method: 'GET' });
  }

  async banUser(id: string, banned: boolean) {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ banned }),
    });
  }
}

export const api = new APIClient();
