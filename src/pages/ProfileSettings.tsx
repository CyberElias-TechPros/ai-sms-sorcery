/**
 * Profile Settings — name, email, phone, avatar (live).
 */

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

const ProfileSettings = () => {
  const { user, updateUserProfile, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phoneNumber: "", avatar: "" });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        avatar: user.avatar || user.avatarUrl || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const ok = await updateUserProfile({
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      avatar: form.avatar,
    });
    if (ok) toast.success("Profile updated");
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Layout>
      <div className="space-y-6 page-enter max-w-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="h-8 px-2"><ArrowLeft size={16} /></Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display">Profile Settings</h1>
          <p className="text-muted-foreground">How you appear across Sorcery</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.avatar} alt={form.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-display">{user?.name}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="+12025550142" className="tabular" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL (https)</Label>
              <Input id="avatar" value={form.avatar} onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))} placeholder="https://…" />
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
