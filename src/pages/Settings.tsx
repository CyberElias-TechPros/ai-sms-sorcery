/**
 * Settings — preferences (persisted server-side), security, data & privacy.
 */

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui-custom/Badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  UserIcon, KeySquare, ArrowRight, Bell, Clock, Database, Trash2,
  LogOut, Download, MessageCircle, ShieldCheck, Loader2, Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import type { UserSettings } from "@/lib/types";

const Settings = () => {
  const { user, logout } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Apply dark mode globally as soon as settings load / change
  useEffect(() => {
    if (!settings) return;
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings]);

  const set = (patch: Partial<UserSettings>) => {
    if (!settings) return;
    if (patch.darkMode !== undefined) {
      localStorage.setItem("sorcery-theme", patch.darkMode ? "dark" : "light");
      document.documentElement.classList.toggle("dark", patch.darkMode);
    }
    updateSettings.mutate(
      { ...settings, ...patch },
      { onSuccess: () => toast.success("Preference saved") },
    );
  };

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next) return;
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      const result = await api.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success(result.message);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Password change failed");
    } finally {
      setPwSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const result = await api.exportAccount();
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sorcery_account_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Account data exported");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm deletion");
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount(deletePassword);
      toast.success("Account deleted");
      logout();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Deletion failed");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const Toggle = ({ id, label, desc, field, disabled }: {
    id: string; label: string; desc: string; field: keyof UserSettings; disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between space-x-2">
      <div>
        <Label htmlFor={id} className="font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch
        id={id}
        checked={Boolean(settings?.[field])}
        disabled={disabled || isLoading || updateSettings.isPending}
        onCheckedChange={(checked) => set({ [field]: checked } as Partial<UserSettings>)}
      />
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">Settings</h1>
          <p className="text-muted-foreground">Manage your account, preferences and compliance</p>
        </div>

        <Separator className="my-6" />

        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data & Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display"><Bell size={17} className="mr-2" /> Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Toggle id="email-notifications" label="Email Notifications" desc="Receive email for important events" field="emailNotifications" />
                <Toggle id="sms-notifications" label="SMS Notifications" desc="Receive text messages for critical alerts" field="smsNotifications" />
                <Toggle id="browser-notifications" label="Browser Notifications" desc="Desktop notifications in your browser" field="browserNotifications" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  {settings?.darkMode ? <Moon size={17} className="mr-2" /> : <Sun size={17} className="mr-2" />} Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Toggle id="dark-mode" label="Dark Mode" desc="Midnight ink, easier on the eyes at night" field="darkMode" />
                <Toggle id="compact-view" label="Compact View" desc="Reduce spacing in lists and tables" field="compactView" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display"><MessageCircle size={17} className="mr-2" /> SMS Compliance</CardTitle>
                <CardDescription>Stay on the right side of messaging regulations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Toggle id="opt-out-footer" label="Add Opt-Out Footer" desc='Automatically append "Reply STOP to unsubscribe" to outgoing messages' field="optOutFooter" />
                <Toggle id="check-compliance" label="Compliance Checking" desc="Guarantee marketing messages carry an opt-out path" field="complianceCheck" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Account Information</CardTitle>
                <CardDescription>Your plan and account controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Profile Settings</div>
                    <div className="text-sm text-muted-foreground">Update your personal information</div>
                  </div>
                  <Link to="/profile-settings">
                    <Button variant="outline" size="sm"><UserIcon className="h-4 w-4 mr-2" /> Manage</Button>
                  </Link>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">API Configuration</div>
                    <div className="text-sm text-muted-foreground">SMS & AI provider keys (encrypted)</div>
                  </div>
                  <Link to="/api-settings">
                    <Button variant="outline" size="sm"><KeySquare className="h-4 w-4 mr-2" /> Configure</Button>
                  </Link>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Subscription Plan</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="bg-primary/5 text-primary capitalize">{(user?.plan || "free_trial").replace("_", " ")}</Badge>
                      <span className="ml-2 tabular">
                        {Math.max(0, (user?.messagesQuota ?? 0) - (user?.messagesUsed ?? 0))} of {user?.messagesQuota ?? 0} messages remaining
                      </span>
                    </div>
                  </div>
                  <Button size="sm" disabled title="Billing integration arrives with your Stripe keys">
                    Upgrade <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium text-destructive">Delete Account</div>
                    <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>

                {deleteOpen && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-destructive">This cannot be undone. Enter your password to confirm.</p>
                    <Input
                      type="password"
                      placeholder="Your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                      <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting && <Loader2 size={13} className="mr-1 animate-spin" />} Delete forever
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display"><ShieldCheck size={17} className="mr-2" /> Password</CardTitle>
                <CardDescription>Changing your password signs out all other sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <Input type="password" value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input type="password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
                </div>
                <Button onClick={changePassword} disabled={pwSaving}>
                  {pwSaving && <Loader2 size={14} className="mr-1 animate-spin" />} Change Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display"><Clock size={17} className="mr-2" /> Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Session timeout</div>
                    <div className="text-sm text-muted-foreground">Automatic sign-out after inactivity</div>
                  </div>
                  <Badge variant="outline">30 days</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Sign out everywhere</div>
                    <div className="text-sm text-muted-foreground">Invalidate every active session</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => { await api.logoutAll().catch(() => undefined); logout(); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out all
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display"><Database size={17} className="mr-2" /> Your Data</CardTitle>
                <CardDescription>Export everything we store about you</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={exportData} disabled={exporting}>
                  {exporting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export account data (JSON)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
