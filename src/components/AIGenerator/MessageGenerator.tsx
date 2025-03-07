
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BrainCircuit, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  PlusCircle, 
  MessageSquare,
  Send,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  generateWhatsAppLink, 
  smartDelay, 
  addRandomization, 
  canSendMoreMessages, 
  incrementMessageCounter,
  getRemainingMessageCount
} from "@/utils/whatsappUtils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MessageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiModel, setAiModel] = useState("gpt-4");
  const [messageType, setMessageType] = useState("marketing");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [isRandomized, setIsRandomized] = useState(true);
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
        marketing: "Limited time offer! Get 25% off on all premium plans. Upgrade now to access exclusive features and boost your productivity. Reply YES to claim your discount!",
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
    setPhoneNumber("");
  };

  const sendToWhatsApp = () => {
    if (!phoneNumber) {
      toast({
        title: "Missing Phone Number",
        description: "Please enter a phone number to send via WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    if (!generatedMessage) {
      toast({
        title: "No Message",
        description: "Please generate a message first.",
        variant: "destructive",
      });
      return;
    }

    // Check if we can send more messages (anti-spam)
    if (!canSendMoreMessages()) {
      toast({
        title: "Message Limit Reached",
        description: `You've reached the hourly limit of WhatsApp messages. Please try again later.`,
        variant: "destructive",
      });
      return;
    }

    // Open confirmation dialog
    setShowWhatsAppDialog(true);
  };

  const confirmWhatsAppSend = () => {
    // Close dialog
    setShowWhatsAppDialog(false);
    
    // Add message randomization if enabled
    let finalMessage = generatedMessage;
    if (isRandomized) {
      finalMessage = addRandomization(generatedMessage);
    }
    
    // Generate WhatsApp link
    const whatsappLink = generateWhatsAppLink(phoneNumber, finalMessage);
    
    // Open WhatsApp
    window.open(whatsappLink, '_blank');
    
    // Increment counter for rate limiting
    incrementMessageCounter();
    
    toast({
      title: "WhatsApp Opening",
      description: "WhatsApp is opening with your message. Please confirm to send.",
    });
    
    // Show remaining message count
    toast({
      title: "Message Quota",
      description: `You have ${getRemainingMessageCount()} WhatsApp messages remaining this hour.`,
      variant: "default",
    });
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
            Generated Message
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
                    <Badge size="sm" variant="secondary">Message Preview</Badge>
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
                    Fill in the details on the left panel and click "Generate Message" to create an AI-powered message.
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
          
          {/* WhatsApp Sending Section */}
          {generatedMessage && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Switch 
                    id="whatsapp-switch"
                    checked={enableWhatsApp}
                    onCheckedChange={setEnableWhatsApp}
                    className="mr-2"
                  />
                  <label 
                    htmlFor="whatsapp-switch" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Send via WhatsApp
                  </label>
                </div>
                
                <Badge 
                  variant="outline" 
                  className="bg-green-500/10 border-green-500/20 text-green-600"
                >
                  Anti-Spam Protected
                </Badge>
              </div>
              
              {enableWhatsApp && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Recipient's Phone Number (with country code)
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. +1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <Switch 
                      id="randomize-switch"
                      checked={isRandomized}
                      onCheckedChange={setIsRandomized}
                      className="mr-2"
                    />
                    <label 
                      htmlFor="randomize-switch" 
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Add slight message variations to avoid spam detection
                    </label>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">WhatsApp Sending Notes:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Number must include country code (e.g., +1 for US)</li>
                      <li>Will open WhatsApp for manual confirmation (prevents spam)</li>
                      <li>Limited to {getRemainingMessageCount()} messages per hour (anti-spam measure)</li>
                    </ul>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20 hover:text-green-700"
                    onClick={sendToWhatsApp}
                    disabled={!enableWhatsApp || !phoneNumber}
                  >
                    <Send size={14} />
                    Send to WhatsApp
                  </Button>
                </div>
              )}
            </div>
          )}
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

      {/* WhatsApp Confirmation Dialog */}
      <AlertDialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm WhatsApp Message
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to open WhatsApp to send a message to <span className="font-medium">{phoneNumber}</span>.
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm text-foreground">
                  {isRandomized ? addRandomization(generatedMessage) : generatedMessage}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmWhatsAppSend}
              className="bg-green-600 hover:bg-green-700"
            >
              Proceed to WhatsApp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessageGenerator;
