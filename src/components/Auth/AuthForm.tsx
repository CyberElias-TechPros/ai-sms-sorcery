/**
 * AuthForm — live register / sign-in against the Sorcery API.
 * Client validation mirrors the server policy (8+ chars, letter + number).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2, Sparkles, Check } from "lucide-react";

const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const passwordOk = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const canSubmit =
    email.includes("@") &&
    password.length >= (mode === "register" ? 8 : 1) &&
    (mode === "login" || (name.trim().length >= 2 && passwordOk));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok =
      mode === "login"
        ? await login({ email, password })
        : await register({ email, password, name, phoneNumber: phone || undefined });
    if (ok) navigate("/dashboard");
  };

  return (
    <Card className="w-full max-w-md border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-glass text-[hsl(40_20%_95%)]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="font-display text-3xl font-semibold">Welcome</CardTitle>
        <CardDescription className="text-white/50">
          {mode === "login" ? "Sign in to your messaging studio" : "Create your studio — 500 free messages included"}
        </CardDescription>
      </CardHeader>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-6 w-[calc(100%-3rem)] bg-white/5 border border-white/10">
          <TabsTrigger value="login" className="data-[state=active]:bg-white/10">Sign In</TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-white/10">Create Account</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="login" className="pt-4">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email" autoComplete="email" required
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password" type="password" autoComplete="current-password" required
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="register" className="pt-4">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name" autoComplete="name" required
                  placeholder="Ada Lovelace"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email" type="email" autoComplete="email" required
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone <span className="text-white/30">(optional)</span></Label>
                <Input
                  id="reg-phone" type="tel" autoComplete="tel"
                  placeholder="+12025550142"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 tabular"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password" type="password" autoComplete="new-password" required
                  placeholder="8+ characters with a number"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {password.length > 0 && (
                  <p className={`text-xs flex items-center gap-1 ${passwordOk ? "text-[hsl(152_48%_52%)]" : "text-white/40"}`}>
                    {passwordOk ? <Check size={12} /> : null}
                    8+ characters with at least one letter and one number
                  </p>
                )}
              </div>
            </CardContent>
          </TabsContent>

          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit || loading}
              className="w-full bg-white text-[hsl(244_24%_5%)] hover:bg-white/90 font-medium shadow-glow"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === "login" ? (
                "Enter the studio"
              ) : (
                <>
                  <Sparkles size={15} className="mr-2" /> Create my studio
                </>
              )}
            </Button>
            <p className="text-[11px] text-white/35 text-center leading-relaxed">
              Keys stay encrypted. Messages stay yours. Cancel anytime by deleting your account.
            </p>
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
