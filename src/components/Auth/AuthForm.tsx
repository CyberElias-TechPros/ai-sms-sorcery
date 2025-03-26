
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2, LucideMessageSquare, BrainCircuit, Check } from "lucide-react";

const AuthForm = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(loginEmail, loginPassword)) {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== confirmPassword) {
      // Toast is handled in the provider
      return;
    }
    
    if (await register({
      email: registerEmail,
      name: registerName,
      password: registerPassword,
      role: "user"
    })) {
      navigate("/dashboard");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-fade-in">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LucideMessageSquare className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">SMS AI Platform</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a 
                    href="#" 
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      // In a real app, this would navigate to a password reset page
                      alert("Password reset functionality would be here in a complete app");
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>Sign in</>
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input 
                  id="register-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>Create account</>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-0">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" disabled>
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
            </svg>
            Google
          </Button>
          <Button variant="outline" disabled>
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.365 1.43c0 1.14-.788 2.042-1.97 2.042-1.177 0-2.042-.9-2.042-2.042 0-1.14.864-2.052 2.043-2.052 1.18 0 1.97.91 1.97 2.052zm4.99 17.716c-.2.632-.45 1.34-.766 2.137-.16.396-.33.796-.5 1.2-.265.640.41.95.4 1.7.39 1.81.694 2.645 1.216 2.645l.176-.027c.734-.28 2.315-1.267 2.315-8.1 0-2.245-.47-4.132-1.125-5.63-.655-1.5-1.51-2.622-2.14-3.195-.63-.592-1.17-.851-1.17-.851l.017 3.821s.347 1.755.854 3.32c.507 1.566 1.144 2.933 1.143 3.585zm-9.53 5.662V12.475c0-1.142-.946-2.16-2.055-2.16-1.11 0-2.053 1.018-2.053 2.16v12.332c0 1.142.944 2.071 2.053 2.071 1.11 0 2.055-.929 2.055-2.071zm-9.193.1c0 1.14-.798 2.052-1.973 2.052-1.174 0-2.042-.879-2.042-2.027 0-1.147.868-2.077 2.042-2.077 1.175 0 1.973.93 1.973 2.052z"></path>
            </svg>
            GitHub
          </Button>
        </div>
      </CardFooter>
      <div className="mt-4 px-8 py-4 bg-muted/50 rounded-b-lg">
        <div className="flex items-start space-x-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1 text-sm">
            <h4 className="font-medium">Our AI-powered platform enables you to:</h4>
            <ul className="space-y-1">
              <li className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Generate professional SMS messages with AI
              </li>
              <li className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Connect with multiple SMS providers
              </li>
              <li className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Schedule and automate your messaging campaigns
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AuthForm;
