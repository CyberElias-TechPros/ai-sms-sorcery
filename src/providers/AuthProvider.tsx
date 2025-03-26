
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, User } from '@/store/authStore';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (user: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    setUser, 
    logout: storeLogout, 
    setToken 
  } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // In a real app, this would validate the token with the backend
        // For this demo, we'll just check if we have a user and token in the store
        if (isAuthenticated && user) {
          // Successful restoration of the session
          console.log("Session restored for user:", user.email);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        // If token validation fails, clear the session
        storeLogout();
      } finally {
        // Always set loading to false once we've checked the session
        setLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated, user, storeLogout]);

  // Mock login function - in a real app, this would call your API
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation for demo purposes
      if (!email.includes('@') || password.length < 6) {
        toast.error("Invalid email or password");
        return false;
      }
      
      // Create mock user for demo - in a real app, this would come from the API
      const mockUser: User = {
        id: `user_${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        role: 'user',
        avatar: ''
      };
      
      // Generate mock token - in a real app, this would come from the API
      const mockToken = `mock_token_${Date.now()}`;
      
      // Update store
      setUser(mockUser);
      setToken(mockToken);
      
      toast.success("Login successful!");
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mock registration function - in a real app, this would call your API
  const register = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation
      if (!userData.email.includes('@')) {
        toast.error("Invalid email address");
        return false;
      }
      
      // Create new user
      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        role: 'user'
      };
      
      // Generate mock token
      const mockToken = `mock_token_${Date.now()}`;
      
      // Update store
      setUser(newUser);
      setToken(mockToken);
      
      toast.success("Registration successful!");
      
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storeLogout();
    navigate('/auth');
    toast.success("You have been logged out");
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
