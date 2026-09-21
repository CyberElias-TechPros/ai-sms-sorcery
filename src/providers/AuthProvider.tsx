/**
 * AuthProvider — real session auth against the Sorcery API.
 * Token lives in the persisted zustand store; every call is a bearer request.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, User, AuthCredentials } from '@/store/authStore';
import { api, ApiError } from '@/lib/api';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  register: (userData: RegisterInput) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loading: true,
  updateUserProfile: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, logout: storeLogout, setToken, token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Restore + validate the session on mount and whenever a token appears.
  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: fresh } = await api.me();
        if (!cancelled) setUser(fresh);
      } catch (err) {
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          storeLogout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initAuth();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async ({ email, password }: AuthCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await api.login({ email, password });
      setUser(result.user);
      setToken(result.token);
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}`);
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, setToken]);

  const register = useCallback(async (userData: RegisterInput): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await api.register({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phoneNumber: userData.phoneNumber || undefined,
      });
      setUser(result.user);
      setToken(result.token);
      toast.success('Your circle is open — welcome to Sorcery');
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, setToken]);

  const logout = useCallback(() => {
    api.logout().catch(() => undefined);
    storeLogout();
    navigate('/auth');
    toast.success('You have been signed out');
  }, [storeLogout, navigate]);

  const updateUserProfile = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await api.updateProfile({
        name: userData.name,
        phoneNumber: userData.phoneNumber ?? undefined,
        avatarUrl: userData.avatarUrl ?? userData.avatar ?? undefined,
        email: userData.email,
      });
      setUser(result.user);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      register,
      logout,
      loading,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
