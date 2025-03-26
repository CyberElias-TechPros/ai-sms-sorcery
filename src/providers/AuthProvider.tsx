
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, User, AuthCredentials } from '@/store/authStore';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'role'> & { password: string }) => Promise<boolean>;
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
  const login = async ({ email, password }: AuthCredentials): Promise<boolean> => {
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
  const register = async (userData: Omit<User, 'id' | 'role'> & { password: string }): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation
      if (!userData.email.includes('@')) {
        toast.error("Invalid email address");
        return false;
      }
      
      if (userData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
      }
      
      // Create new user - in a real app, this would be handled by the API
      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        role: 'user'
      };
      
      // Remove password from the user object that's stored in state
      // (password should only be sent to the backend, not stored in frontend state)
      const { password, ...userWithoutPassword } = newUser as (User & { password: string });
      
      // Generate mock token
      const mockToken = `mock_token_${Date.now()}`;
      
      // Update store
      setUser(userWithoutPassword);
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

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (user) {
        // Update user in store
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        
        toast.success("Profile updated successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login,
      register,
      logout,
      loading,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
