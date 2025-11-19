const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    // Use a plain object for headers to allow 'Authorization' property
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetail = 'An error occurred';
        let errorBody: any = null;
        let errorText: string | null = null;
        try {
          errorBody = await response.json();
          errorDetail = errorBody.detail || JSON.stringify(errorBody);
        } catch (jsonErr) {
          try {
            errorText = await response.text();
            errorDetail = errorText;
          } catch {}
        }
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          error: errorBody || errorText || errorDetail,
        });
        throw new Error(`${response.status} ${response.statusText}: ${errorDetail}`);
      }

      return response.json();
    } catch (error) {
      console.error("API Request Failed:", error);
      throw error;
    }
  }

  // Auth
  async signup(email: string, password: string, fullName?: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  // Files
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async getFiles() {
    return this.request('/files');
  }

  async getFileStatus(fileId: string) {
    return this.request(`/files/${fileId}/status`);
  }

  async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}`, { method: 'DELETE' });
  }

  // Rulesets
  async createRuleset(name: string, config: any) {
    return this.request('/rulesets', {
      method: 'POST',
      body: JSON.stringify({ name, config }),
    });
  }

  async getRulesets() {
    return this.request('/rulesets');
  }

  async getRuleset(id: string) {
    return this.request(`/rulesets/${id}`);
  }

  // Questions
  async generateQuestions(fileId: string, rulesetId: string, topic?: string) {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify({ file_id: fileId, ruleset_id: rulesetId, topic }),
    });
  }

  // Quizzes
  async createQuiz(rulesetId: string, questionIds: string[], timeLimit?: number) {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify({ ruleset_id: rulesetId, question_ids: questionIds, time_limit: timeLimit }),
    });
  }

  async startQuiz(quizId: string) {
    return this.request(`/quizzes/${quizId}/start`, { method: 'POST' });
  }

  async submitAnswer(quizId: string, questionId: string, selectedAnswer: string) {
    return this.request(`/quizzes/${quizId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer }),
    });
  }

  async finishQuiz(quizId: string) {
    return this.request(`/quizzes/${quizId}/finish`, { method: 'POST' });
  }
}

export const apiClient = new ApiClient();

// Removed conflicting export type for ApiClient
