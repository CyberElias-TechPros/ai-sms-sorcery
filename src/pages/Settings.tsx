
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  User, Shield, Bell, Key, KeyRound, Smartphone, 
  CreditCard, MessageSquare, BrainCircuit, Globe, CloudCog,
  Save, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  // User profile state
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+1234567890");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [deliveryReceipts, setDeliveryReceipts] = useState(true);
  
  // API settings
  const [currentApiProvider, setCurrentApiProvider] = useState("twilio");
  const [aiProvider, setAiProvider] = useState("openai");
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ArrowLeft size={16} />
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <Button onClick={saveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
        
        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User size={14} />
              <span className="hidden md:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell size={14} />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-1">
              <Key size={14} />
              <span className="hidden md:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Shield size={14} />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1">
              <CreditCard size={14} />
              <span className="hidden md:inline">Billing</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="America/New_York"
                  >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your account via email
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important alerts via SMS
                      </p>
                    </div>
                    <Switch 
                      checked={smsNotifications} 
                      onCheckedChange={setSmsNotifications} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly summary of your messaging activity
                      </p>
                    </div>
                    <Switch 
                      checked={weeklyReports} 
                      onCheckedChange={setWeeklyReports} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Delivery Receipts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when messages are delivered
                      </p>
                    </div>
                    <Switch 
                      checked={deliveryReceipts} 
                      onCheckedChange={setDeliveryReceipts} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* API Tab */}
          <TabsContent value="api">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                    SMS API Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your SMS API provider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Provider</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={currentApiProvider}
                      onChange={(e) => setCurrentApiProvider(e.target.value)}
                    >
                      <option value="twilio">Twilio</option>
                      <option value="termii">Termii</option>
                      <option value="infobip">Infobip</option>
                      <option value="vonage">Vonage</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input 
                      id="apiKey" 
                      type="password" 
                      placeholder="Enter your API key" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input 
                      id="apiSecret" 
                      type="password" 
                      placeholder="Enter your API secret" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="senderID">Sender ID</Label>
                    <Input 
                      id="senderID" 
                      placeholder="Your sender ID" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The name or number that recipients will see
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast({
                      title: "Testing Connection",
                      description: "Testing connection to SMS API...",
                    })}
                  >
                    Test Connection
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
                    AI API Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your AI model provider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                    >
                      <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="google">Google (Gemini)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aiApiKey">API Key</Label>
                    <Input 
                      id="aiApiKey" 
                      type="password" 
                      placeholder="Enter your AI API key" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Default Model</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="gpt-4"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="gemini-pro">Gemini Pro</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model Parameters</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="temperature" className="text-xs">Temperature</Label>
                        <Input 
                          id="temperature" 
                          type="number" 
                          placeholder="0.7" 
                          min="0" 
                          max="2" 
                          step="0.1" 
                          defaultValue="0.7"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxTokens" className="text-xs">Max Tokens</Label>
                        <Input 
                          id="maxTokens" 
                          type="number" 
                          placeholder="150" 
                          min="1" 
                          defaultValue="150"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast({
                      title: "Testing AI Connection",
                      description: "Testing connection to AI API...",
                    })}
                  >
                    Test AI Connection
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled} 
                      onCheckedChange={setTwoFactorEnabled} 
                    />
                  </div>
                  
                  {twoFactorEnabled && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm mb-3">
                        Two-factor authentication is enabled. You will receive a verification code each time you log in.
                      </p>
                      <Button size="sm" variant="outline">
                        <Smartphone className="mr-2 h-4 w-4" />
                        Manage Devices
                      </Button>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label className="text-base">Password</Label>
                    <Button variant="outline">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label className="text-base">Session Management</Label>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium">Current Session</p>
                          <p className="text-xs text-muted-foreground">Chrome on Windows • Active Now</p>
                        </div>
                        <Badge variant="outline">Current</Badge>
                      </div>
                      <Button variant="destructive" size="sm">Sign Out of All Devices</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription and Billing</CardTitle>
                <CardDescription>
                  Manage your subscription, payment methods, and billing history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Business Plan</h3>
                      <p className="text-muted-foreground text-sm">10,000 messages per month</p>
                    </div>
                    <Badge>Current Plan</Badge>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-bold">$49</span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button>Upgrade Plan</Button>
                    <Button variant="outline">Manage Subscription</Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
                          <CreditCard size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Visa ending in 4242</p>
                          <p className="text-xs text-muted-foreground">Expires 12/2024</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Billing History</h3>
                    <div className="border rounded-lg divide-y">
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Business Plan - Monthly</p>
                          <p className="text-xs text-muted-foreground">May 1, 2023</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">$49.00</p>
                          <Button variant="link" size="sm" className="h-auto p-0">Receipt</Button>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Business Plan - Monthly</p>
                          <p className="text-xs text-muted-foreground">Apr 1, 2023</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">$49.00</p>
                          <Button variant="link" size="sm" className="h-auto p-0">Receipt</Button>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Business Plan - Monthly</p>
                          <p className="text-xs text-muted-foreground">Mar 1, 2023</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">$49.00</p>
                          <Button variant="link" size="sm" className="h-auto p-0">Receipt</Button>
                        </div>
                      </div>
                    </div>
                  </div>
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
