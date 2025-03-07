
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Sparkles, RefreshCw, Copy, PlusCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MessageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiModel, setAiModel] = useState("gpt-4");
  const [messageType, setMessageType] = useState("marketing");
  const { toast } = useToast();
  
  const generateMessage = () => {
    if (!prompt) {
      toast({
        title: "Missing Prompt",
        description: "Please provide details for your message generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (would be replaced with actual API call)
    setTimeout(() => {
      const messages = {
        marketing: "🌟 Limited time offer! Get 25% off on all premium plans. Upgrade now to access exclusive features and boost your productivity. Reply YES to claim your discount!",
        reminder: "Friendly reminder: Your appointment is scheduled for tomorrow at 2:00 PM. Please arrive 10 minutes early. Reply CONFIRM to confirm your attendance or call us to reschedule.",
        notification: "Your package has been shipped and is on its way! Tracking number: TRK12345. Estimated delivery: June 10th. Track your package at example.com/track",
        alert: "ALERT: We detected unusual activity on your account. If this wasn't you, please contact our security team immediately at 1-800-123-4567 or reply HELP for assistance."
      };
      
      // Select a message based on the type
      setGeneratedMessage(messages[messageType as keyof typeof messages]);
      setIsGenerating(false);
      
      toast({
        title: "Message Generated",
        description: "Your AI-generated message is ready!",
      });
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const clearAll = () => {
    setPrompt("");
    setGeneratedMessage("");
  };

  const messageTypeOptions = [
    { value: "marketing", label: "Marketing" },
    { value: "reminder", label: "Reminder" },
    { value: "notification", label: "Notification" },
    { value: "alert", label: "Alert" }
  ];

  const aiModelOptions = [
    { value: "gpt-4", label: "GPT-4" },
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "claude-3", label: "Claude 3" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card variant="border" className="overflow-hidden flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
            AI Message Generator
          </CardTitle>
          <CardDescription>
            Describe the SMS message you want to create
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Type</label>
              <Select 
                value={messageType} 
                onValueChange={setMessageType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {messageTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select 
                value={aiModel} 
                onValueChange={setAiModel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {aiModelOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium mb-2">Prompt</label>
            <Textarea 
              placeholder="Describe the message you want to generate... (e.g. 'Create a marketing SMS for a 25% off sale on our premium subscription')"
              className="flex-1 resize-none min-h-[150px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={clearAll}
          >
            Clear
          </Button>
          <Button
            onClick={generateMessage}
            loading={isGenerating}
            className="gap-2"
          >
            {!isGenerating && <Sparkles size={16} />}
            Generate Message
          </Button>
        </CardFooter>
      </Card>
      
      <Card variant="border" className="overflow-hidden flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Generated SMS
          </CardTitle>
          <CardDescription>
            Preview and edit your AI-generated message
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex-1 flex flex-col">
          <Tabs defaultValue="preview" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 flex flex-col mt-0">
              {generatedMessage ? (
                <div className="p-4 border rounded-lg h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Badge size="sm" variant="secondary">SMS Preview</Badge>
                    <Badge size="sm" variant="outline">{aiModel}</Badge>
                  </div>
                  <div className="flex-1 bg-muted/30 rounded-lg p-4 shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {generatedMessage || "Your generated message will appear here..."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground border border-dashed rounded-lg">
                  <BrainCircuit size={40} className="mb-3 text-muted" />
                  <h3 className="text-lg font-medium mb-2">No Message Generated Yet</h3>
                  <p className="text-sm max-w-md">
                    Fill in the details on the left panel and click "Generate Message" to create an AI-powered SMS.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="edit" className="flex-1 flex flex-col mt-0">
              <Textarea 
                placeholder="Your generated message will appear here for editing..."
                className="flex-1 resize-none min-h-[200px]"
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={generateMessage}
              disabled={!prompt || isGenerating}
              size="sm"
            >
              <RefreshCw size={14} className="mr-1" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={!generatedMessage}
              size="sm"
            >
              <Copy size={14} className="mr-1" />
              Copy
            </Button>
          </div>
          <Button
            disabled={!generatedMessage}
            size="sm"
          >
            <PlusCircle size={14} className="mr-1" />
            Use This Message
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MessageGenerator;
