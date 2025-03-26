
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  getSmsApiConfig, getAiApiConfig, setSmsApiConfig, setAiApiConfig, 
  testSmsApiConnection, testAiApiConnection 
} from "@/utils/apiServices";
import { Loader2, KeyRound, LucideMessageSquare, BrainCircuit, CheckCircle2, AlertCircle } from "lucide-react";

const ApiSettings = () => {
  const [smsConfig, setSmsConfig] = useState({
    provider: "twilio",
    apiKey: "",
    apiSecret: "",
    senderId: "",
  });

  const [aiConfig, setAiConfig] = useState({
    provider: "openai",
    apiKey: "",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 150
  });

  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    // Load saved configs
    const loadConfigs = () => {
      try {
        const savedSmsConfig = getSmsApiConfig();
        setSmsConfig(prevConfig => ({
          ...prevConfig,
          ...savedSmsConfig
        }));

        const savedAiConfig = getAiApiConfig();
        setAiConfig(prevConfig => ({
          ...prevConfig,
          ...savedAiConfig
        }));
      } catch (error) {
        console.error("Error loading API configurations:", error);
        toast.error("Failed to load API configurations");
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfigs();
  }, []);

  const handleSmsConfigChange = (field: string, value: string | number) => {
    setSmsConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleAiConfigChange = (field: string, value: string | number) => {
    setAiConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSmsConfig = () => {
    try {
      setSmsApiConfig(smsConfig);
      toast.success("SMS API configuration saved successfully");
    } catch (error) {
      console.error("Error saving SMS API configuration:", error);
      toast.error("Failed to save SMS API configuration");
    }
  };

  const handleSaveAiConfig = () => {
    try {
      setAiApiConfig(aiConfig);
      toast.success("AI API configuration saved successfully");
    } catch (error) {
      console.error("Error saving AI API configuration:", error);
      toast.error("Failed to save AI API configuration");
    }
  };

  const handleTestSmsConnection = async () => {
    setIsTestingSms(true);
    try {
      const success = await testSmsApiConnection();
      if (!success) {
        toast.error("SMS API connection test failed");
      }
    } catch (error) {
      console.error("Error testing SMS API connection:", error);
      toast.error("SMS API connection test failed");
    } finally {
      setIsTestingSms(false);
    }
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    try {
      const success = await testAiApiConnection();
      if (!success) {
        toast.error("AI API connection test failed");
      }
    } catch (error) {
      console.error("Error testing AI API connection:", error);
      toast.error("AI API connection test failed");
    } finally {
      setIsTestingAi(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Settings</h1>
          <p className="text-muted-foreground">
            Configure your SMS and AI API integrations
          </p>
        </div>

        {isLoadingConfig ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="sms">SMS Providers</TabsTrigger>
              <TabsTrigger value="ai">AI Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LucideMessageSquare className="h-5 w-5 mr-2" />
                    SMS Provider Configuration
                  </CardTitle>
                  <CardDescription>
                    Connect your SMS service provider to send messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-provider">Provider</Label>
                    <Select
                      value={smsConfig.provider}
                      onValueChange={(value) => handleSmsConfigChange("provider", value)}
                    >
                      <SelectTrigger id="sms-provider">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="termii">Termii</SelectItem>
                        <SelectItem value="infobip">Infobip</SelectItem>
                        <SelectItem value="messagebird">MessageBird</SelectItem>
                        <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sms-api-key">API Key</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sms-api-key"
                        type="password"
                        placeholder="Enter your API key"
                        value={smsConfig.apiKey}
                        onChange={(e) => handleSmsConfigChange("apiKey", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sms-api-secret">API Secret (if required)</Label>
                    <Input
                      id="sms-api-secret"
                      type="password"
                      placeholder="Enter your API secret"
                      value={smsConfig.apiSecret}
                      onChange={(e) => handleSmsConfigChange("apiSecret", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sms-sender-id">Sender ID</Label>
                    <Input
                      id="sms-sender-id"
                      placeholder="Enter your sender ID or name"
                      value={smsConfig.senderId}
                      onChange={(e) => handleSmsConfigChange("senderId", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will appear as the sender of your messages
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleTestSmsConnection}
                    disabled={isTestingSms || !smsConfig.apiKey}
                  >
                    {isTestingSms ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleSaveSmsConfig}
                    disabled={!smsConfig.apiKey || !smsConfig.provider}
                  >
                    Save Configuration
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BrainCircuit className="h-5 w-5 mr-2" />
                    AI Provider Configuration
                  </CardTitle>
                  <CardDescription>
                    Connect your AI service to generate message content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-provider">Provider</Label>
                    <Select
                      value={aiConfig.provider}
                      onValueChange={(value) => handleAiConfigChange("provider", value)}
                    >
                      <SelectTrigger id="ai-provider">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="claude">Anthropic Claude</SelectItem>
                        <SelectItem value="mistral">Mistral AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-api-key">API Key</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ai-api-key"
                        type="password"
                        placeholder="Enter your API key"
                        value={aiConfig.apiKey}
                        onChange={(e) => handleAiConfigChange("apiKey", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-model">Model</Label>
                    <Select
                      value={aiConfig.model}
                      onValueChange={(value) => handleAiConfigChange("model", value)}
                    >
                      <SelectTrigger id="ai-model">
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiConfig.provider === "openai" && (
                          <>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </>
                        )}
                        {aiConfig.provider === "gemini" && (
                          <>
                            <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                          </>
                        )}
                        {aiConfig.provider === "claude" && (
                          <>
                            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                            <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          </>
                        )}
                        {aiConfig.provider === "mistral" && (
                          <>
                            <SelectItem value="mistral-small">Mistral Small</SelectItem>
                            <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                            <SelectItem value="mistral-large">Mistral Large</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-temperature">Temperature</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="ai-temperature"
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={aiConfig.temperature}
                          onChange={(e) => handleAiConfigChange("temperature", parseFloat(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          (0-1)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai-max-tokens">Max Tokens</Label>
                      <Input
                        id="ai-max-tokens"
                        type="number"
                        min="1"
                        max="2000"
                        value={aiConfig.maxTokens}
                        onChange={(e) => handleAiConfigChange("maxTokens", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleTestAiConnection}
                    disabled={isTestingAi || !aiConfig.apiKey}
                  >
                    {isTestingAi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleSaveAiConfig}
                    disabled={!aiConfig.apiKey || !aiConfig.provider || !aiConfig.model}
                  >
                    Save Configuration
                  </Button>
                </CardFooter>
              </Card>

              <div className="bg-muted p-4 rounded-lg border">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Important Note:</p>
                    <p>API keys are stored in your browser's local storage. For production use, consider implementing server-side storage for better security.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ApiSettings;
