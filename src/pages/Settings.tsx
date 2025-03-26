
import { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui-custom/Button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui-custom/Badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { 
  UserIcon, KeySquare, AlertTriangle, ArrowRight, Bell, 
  Clock, Smartphone, Database, ShieldCheck, Trash2, 
  LogOut, Download, BookCopy, MessageCircle
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

const Settings = () => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog and call an API
    toast.error("This feature is not implemented in the demo version.");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Separator className="my-6" />

        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data & Privacy</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notificationsEnabled} 
                    onCheckedChange={setNotificationsEnabled} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive text messages for critical alerts</p>
                  </div>
                  <Switch id="sms-notifications" />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="browser-notifications" className="font-medium">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">Show desktop notifications in your browser</p>
                  </div>
                  <Switch 
                    id="browser-notifications" 
                    checked={true} 
                    disabled 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={darkModeEnabled} 
                    onCheckedChange={setDarkModeEnabled} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="compact-view" className="font-medium">Compact View</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing in lists and tables</p>
                  </div>
                  <Switch id="compact-view" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Behavior</CardTitle>
                <CardDescription>Configure how the application behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="auto-save" className="font-medium">Auto Save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save drafts while typing</p>
                  </div>
                  <Switch 
                    id="auto-save" 
                    checked={autoSaveEnabled} 
                    onCheckedChange={setAutoSaveEnabled} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="session-timeout" className="font-medium">Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline">30 minutes</Badge>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <Clock className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Profile Settings</div>
                    <div className="text-sm text-muted-foreground">Update your personal information</div>
                  </div>
                  <Link to="/profile-settings">
                    <Button variant="outline" size="sm">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">API Configuration</div>
                    <div className="text-sm text-muted-foreground">Set up your SMS and AI API keys</div>
                  </div>
                  <Link to="/api-settings">
                    <Button variant="outline" size="sm">
                      <KeySquare className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </Link>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Subscription Plan</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="bg-primary/5 text-primary">Free Trial</Badge>
                      <span className="ml-2">500 SMS messages remaining</span>
                    </div>
                  </div>
                  <Button size="sm">
                    Upgrade
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium text-destructive">Delete Account</div>
                    <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-muted-foreground">Last changed 30 days ago</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="warning">Not Enabled</Badge>
                    </div>
                  </div>
                  <Button size="sm">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Enable
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Active Sessions</div>
                    <div className="text-sm text-muted-foreground">1 active session on this device</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Sessions
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Logout Everywhere</div>
                    <div className="text-sm text-muted-foreground">Sign out from all devices</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout All
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 shrink-0 mt-0.5 text-yellow-600" />
                    <span>Enable two-factor authentication for enhanced security</span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 shrink-0 mt-0.5 text-yellow-600" />
                    <span>Use a strong, unique password that you don't use elsewhere</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Data & Privacy Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Data Export</div>
                    <div className="text-sm text-muted-foreground">Download all your data in JSON format</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Message Storage</div>
                    <div className="text-sm text-muted-foreground">Control how long messages are stored</div>
                  </div>
                  <Badge variant="outline">90 Days</Badge>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">API Usage Data</div>
                    <div className="text-sm text-muted-foreground">Manage data collected from API calls</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium">Privacy Policy</div>
                    <div className="text-sm text-muted-foreground">Review our privacy practices</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <BookCopy className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>SMS Compliance</CardTitle>
                <CardDescription>Manage SMS legal compliance settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="opt-out-footer" className="font-medium">Add Opt-Out Footer</Label>
                    <p className="text-sm text-muted-foreground">Automatically append "Text STOP to unsubscribe" to messages</p>
                  </div>
                  <Switch id="opt-out-footer" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="check-compliance" className="font-medium">Compliance Checking</Label>
                    <p className="text-sm text-muted-foreground">Automatically check messages for regulatory compliance</p>
                  </div>
                  <Switch id="check-compliance" defaultChecked />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Compliance Documentation</div>
                    <div className="text-sm text-muted-foreground">Review SMS legal requirements</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
