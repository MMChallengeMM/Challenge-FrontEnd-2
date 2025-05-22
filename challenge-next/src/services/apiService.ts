import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, AUTH_CONFIG, REQUEST_TIMEOUT } from '../../config';

// Cria instância do Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request com InternalAxiosRequestConfig
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Proteção contra SSR
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

    if (token) {
      // Garante que headers seja do tipo indexável
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)[
        AUTH_CONFIG.tokenHeader
      ] = `${AUTH_CONFIG.tokenPrefix} ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response padrão
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error);

    if (
      error.response?.status === 401 &&
      !error.config.url?.includes('/login')
    ) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('auth');
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Tipagens
export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  nome: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Service layer
export const apiService = {
  login: async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/user/login', {
      username,
      password,
    });
    return response.data;
  },
  getUsers: async (params = {}): Promise<User[]> => {
    const response = await api.get<User[]>('/user', { params });
    return response.data;
  },
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/user/${id}`);
    return response.data;
  },
  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/user', userData);
    return response.data;
  },
  updateUser: async (
    id: number,
    userData: Partial<User>
  ): Promise<User> => {
    const response = await api.put<User>(`/user/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/user/${id}`);
  },
  getFalhas: async (params = {}) => {
    const response = await api.get('/falhas', { params });
    return response.data;
  },
  
  getFalhaById: async (id: number) => {
    const response = await api.get(`/falhas/${id}`);
    return response.data;
  },
  
  createFalha: async (falhaData: any) => {
    const response = await api.post('/falhas', falhaData);
    return response.data;
  },
  
  updateFalha: async (id: number, falhaData: any) => {
    const response = await api.put(`/falhas/${id}`, falhaData);
    return response.data;
  },
  
  deleteFalha: async (id: number): Promise<void> => {
    await api.delete(`/falhas/${id}`);
  },
  
  // Métodos para relatórios
  getRelatorios: async (params = {}) => {
    const response = await api.get('/relatorios', { params });
    return response.data;
  },
  
  getRelatorioById: async (id: number) => {
    const response = await api.get(`/relatorios/${id}`);
    return response.data;
  },
  
  generateRelatorio: async (relatorioParams: any) => {
    const response = await api.post('/relatorios/generate', relatorioParams);
    return response.data;
  },
  
  // Método genérico para download de arquivos
  downloadFile: async (url: string, filename: string) => {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // Criar um link para download e clicar nele
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default api;
