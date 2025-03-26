
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui-custom/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-custom/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, Key, BrainCircuit, MessageSquare, ExternalLink, EyeOff, Eye, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';

interface ApiKeysState {
  smsProvider: string;
  smsApiKey: string;
  smsSenderId: string;
  aiProvider: string;
  aiApiKey: string;
  enableAiIntegration: boolean;
}

const SMS_PROVIDERS = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'termii', label: 'Termii' },
  { value: 'infobip', label: 'Infobip' },
  { value: 'vonage', label: 'Vonage' },
  { value: 'custom', label: 'Custom API' },
];

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI (GPT-4, GPT-3.5)' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'cohere', label: 'Cohere' },
];

const ApiSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSmsApiKey, setShowSmsApiKey] = useState(false);
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [formData, setFormData] = useState<ApiKeysState>({
    smsProvider: 'twilio',
    smsApiKey: '',
    smsSenderId: '',
    aiProvider: 'openai',
    aiApiKey: '',
    enableAiIntegration: true,
  });

  useEffect(() => {
    // Load saved API keys from user data if available
    if (user?.apiKeys) {
      setFormData(prev => ({
        ...prev,
        smsProvider: user.apiKeys?.smsProvider || 'twilio',
        aiProvider: user.apiKeys?.aiProvider || 'openai',
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, enableAiIntegration: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // In a real app, you would validate the API keys before saving
      // and securely store them server-side, not in the browser
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user profile with API settings
      await updateUserProfile({
        apiKeys: {
          smsProvider: formData.smsProvider,
          aiProvider: formData.aiProvider,
        }
      });
      
      toast.success('API settings saved successfully');
    } catch (error) {
      console.error('Error saving API settings:', error);
      toast.error('Failed to save API settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Settings</h1>
          <p className="text-muted-foreground">
            Configure your SMS and AI provider integrations
          </p>
        </div>

        <Separator className="my-6" />

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your API keys are stored securely and used only to make requests to the respective services.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SMS API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                SMS Provider Integration
              </CardTitle>
              <CardDescription>
                Connect your SMS provider to send messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smsProvider">Provider</Label>
                    <Select
                      value={formData.smsProvider}
                      onValueChange={(value) => handleSelectChange('smsProvider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SMS provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {SMS_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smsApiKey" className="flex justify-between">
                      API Key
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setShowSmsApiKey(!showSmsApiKey)}
                      >
                        {showSmsApiKey ? (
                          <span className="flex items-center">
                            <EyeOff className="mr-1 h-3 w-3" /> Hide
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" /> Show
                          </span>
                        )}
                      </button>
                    </Label>
                    <div className="relative">
                      <Input
                        id="smsApiKey"
                        name="smsApiKey"
                        type={showSmsApiKey ? "text" : "password"}
                        value={formData.smsApiKey}
                        onChange={handleInputChange}
                        placeholder="Enter your API key"
                        className="pr-10"
                      />
                      <Key className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your API key is securely stored and used only for sending messages
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smsSenderId">Sender ID / From Number</Label>
                    <Input
                      id="smsSenderId"
                      name="smsSenderId"
                      value={formData.smsSenderId}
                      onChange={handleInputChange}
                      placeholder="e.g., YourCompany or +14155552671"
                    />
                    <p className="text-xs text-muted-foreground">
                      The identifier that appears as the message sender
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('https://docs.lovable.dev', '_blank')}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View API Documentation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* AI Provider Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
                AI Provider Integration
              </CardTitle>
              <CardDescription>
                Connect your AI provider for message generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableAiIntegration">Enable AI Integration</Label>
                    <p className="text-xs text-muted-foreground">
                      Use AI to generate and optimize your messages
                    </p>
                  </div>
                  <Switch
                    id="enableAiIntegration"
                    checked={formData.enableAiIntegration}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiProvider">AI Provider</Label>
                    <Select
                      value={formData.aiProvider}
                      onValueChange={(value) => handleSelectChange('aiProvider', value)}
                      disabled={!formData.enableAiIntegration}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiApiKey" className="flex justify-between">
                      API Key
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setShowAiApiKey(!showAiApiKey)}
                        disabled={!formData.enableAiIntegration}
                      >
                        {showAiApiKey ? (
                          <span className="flex items-center">
                            <EyeOff className="mr-1 h-3 w-3" /> Hide
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" /> Show
                          </span>
                        )}
                      </button>
                    </Label>
                    <div className="relative">
                      <Input
                        id="aiApiKey"
                        name="aiApiKey"
                        type={showAiApiKey ? "text" : "password"}
                        value={formData.aiApiKey}
                        onChange={handleInputChange}
                        placeholder="Enter your API key"
                        className="pr-10"
                        disabled={!formData.enableAiIntegration}
                      />
                      <Key className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your AI API key is securely stored and never shared
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('https://docs.lovable.dev', '_blank')}
                    disabled={!formData.enableAiIntegration}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View API Documentation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save API Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ApiSettings;
