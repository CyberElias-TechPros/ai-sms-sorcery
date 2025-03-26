
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "@/components/Auth/AuthForm";
import { useAuth } from "@/providers/AuthProvider";

const Auth = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  useEffect(() => {
    // If user is already authenticated, redirect to returnUrl or dashboard
    if (!loading && isAuthenticated) {
      navigate(returnUrl);
    }
  }, [isAuthenticated, loading, navigate, returnUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/50">
      <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
      <AuthForm />
    </div>
  );
};

export default Auth;
