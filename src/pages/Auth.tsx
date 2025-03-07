
import AuthForm from "@/components/Auth/AuthForm";

const Auth = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/50">
      <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
      <AuthForm />
    </div>
  );
};

export default Auth;
