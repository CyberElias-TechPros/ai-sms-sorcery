
import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, Users, Send, PencilLine, Clock, 
  AlertCircle, HelpCircle, ArrowLeft, Check, ListPlus, FileText
} from "lucide-react";
import { 
  checkNumberOnWhatsApp, 
  generateWhatsAppLink, 
  canSendMoreMessages, 
  smartDelay,
  addRandomization 
} from "@/utils/whatsappUtils";
import { toast } from "@/components/ui/use-toast";

const SMSComposer = () => {
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [preferredChannel, setPreferredChannel] = useState("auto");
  const [messageType, setMessageType] = useState("promotional");
  const [recipientCount, setRecipientCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState("$0.00");
  const [whatsappEligible, setWhatsappEligible] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleRecipientsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecipients(e.target.value);
    
    // Count recipients and update UI
    const phoneNumbers = e.target.value
      .split(/[,\n]/)
      .map(num => num.trim())
      .filter(num => num.length > 0);
    
    setRecipientCount(phoneNumbers.length);
    
    // Calculate estimated cost (example: $0.01 per SMS)
    const cost = (phoneNumbers.length * 0.01).toFixed(2);
    setEstimatedCost(`$${cost}`);
    
    // Analyze for WhatsApp eligibility
    if (phoneNumbers.length > 0) {
      setIsAnalyzing(true);
      
      // This would ideally be a batch operation for efficiency
      Promise.all(phoneNumbers.map(number => checkNumberOnWhatsApp(number)))
        .then(results => {
          const eligibleCount = results.filter(result => result).length;
          setWhatsappEligible(eligibleCount);
          setIsAnalyzing(false);
        })
        .catch(error => {
          console.error("Error checking WhatsApp eligibility:", error);
          setIsAnalyzing(false);
        });
    } else {
      setWhatsappEligible(0);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !recipients.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both a message and at least one recipient.",
        variant: "destructive"
      });
      return;
    }

    if (!canSendMoreMessages()) {
      toast({
        title: "Rate limit reached",
        description: "You've reached the messaging limit. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    const phoneNumbers = recipients
      .split(/[,\n]/)
      .map(num => num.trim())
      .filter(num => num.length > 0);
    
    let successCount = 0;
    
    // Process each number
    for (const number of phoneNumbers) {
      try {
        // Check if number is on WhatsApp and user preference
        const isOnWhatsApp = await checkNumberOnWhatsApp(number);
        const useWhatsApp = (preferredChannel === "whatsapp" || 
                           (preferredChannel === "auto" && isOnWhatsApp));
        
        if (useWhatsApp) {
          // Send via WhatsApp
          const randomizedMessage = addRandomization(message);
          const whatsappLink = generateWhatsAppLink(number, randomizedMessage);
          
          // Open WhatsApp link in a new tab
          window.open(whatsappLink, "_blank");
          
          // Update UI to show the message is being sent
          toast({
            title: "WhatsApp message ready",
            description: `Message to ${number} ready to send. Please confirm in WhatsApp.`,
          });
          
          successCount++;
          
          // Wait to prevent spam detection
          await smartDelay(2000);
        } else {
          // This would be where an SMS API call would happen
          // For now, we'll just simulate it
          await new Promise(resolve => setTimeout(resolve, 500));
          
          toast({
            title: "SMS sent",
            description: `Message sent to ${number} via SMS.`,
          });
          
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending to ${number}:`, error);
        toast({
          title: "Failed to send",
          description: `Could not send message to ${number}.`,
          variant: "destructive"
        });
      }
    }
    
    setIsSending(false);
    
    // Final toast notification
    if (successCount > 0) {
      toast({
        title: "Messages processed",
        description: `Successfully processed ${successCount} out of ${phoneNumbers.length} messages.`,
      });
    }
  };

  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160) || 1;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                <a href="/dashboard">
                  <ArrowLeft size={16} />
                </a>
              </Button>
              <Badge variant="outline" size="sm">
                <MessageSquare size={12} className="mr-1" />
                Messaging
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SMS Composer</h1>
            <p className="text-muted-foreground">
              Create and send messages to individuals or groups
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composer Area */}
          <div className="lg:col-span-2">
            <Card variant="border">
              <CardHeader>
                <CardTitle>Message Composer</CardTitle>
                <CardDescription>
                  Craft your message and select recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="compose"
                  className="w-full"
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compose">
                      <PencilLine size={16} className="mr-2" />
                      Compose
                    </TabsTrigger>
                    <TabsTrigger value="recipients">
                      <Users size={16} className="mr-2" />
                      Recipients
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="compose" className="pt-4 space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="messageType">Message Type</Label>
                          <Select
                            value={messageType}
                            onValueChange={setMessageType}
                          >
                            <SelectTrigger id="messageType">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="transactional">Transactional</SelectItem>
                              <SelectItem value="reminder">Reminder</SelectItem>
                              <SelectItem value="alert">Alert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="channel">Preferred Channel</Label>
                          <Select
                            value={preferredChannel}
                            onValueChange={setPreferredChannel}
                          >
                            <SelectTrigger id="channel">
                              <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">
                                Auto (SMS/WhatsApp)
                              </SelectItem>
                              <SelectItem value="sms">SMS Only</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Message Content</Label>
                        <Textarea
                          id="message"
                          placeholder="Type your message here..."
                          className="min-h-[150px] resize-y"
                          value={message}
                          onChange={handleTextChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {characterCount} characters 
                            ({smsCount} SMS {smsCount > 1 ? "messages" : "message"})
                          </span>
                          <span>
                            {160 - (characterCount % 160 || 160)} characters left in current SMS
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button variant="outline" size="sm">
                          <FileText size={14} className="mr-1" />
                          Load Template
                        </Button>
                        <Button variant="outline" size="sm">
                          <ListPlus size={14} className="mr-1" />
                          Save as Template
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recipients" className="pt-4 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipients">
                          Phone Numbers 
                          <span className="text-muted-foreground ml-2 text-xs">
                            (one per line or comma-separated)
                          </span>
                        </Label>
                        <Textarea
                          id="recipients"
                          placeholder="+1234567890, +0987654321"
                          className="min-h-[150px] resize-y"
                          value={recipients}
                          onChange={handleRecipientsChange}
                        />
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button variant="outline" size="sm">
                          <Users size={14} className="mr-1" />
                          Select from Contacts
                        </Button>
                        <Button variant="outline" size="sm">
                          <ListPlus size={14} className="mr-1" />
                          Create Contact Group
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator className="my-6" />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <Button 
                    className="w-full md:w-auto"
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim() || !recipients.trim()}
                  >
                    {isSending ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="w-full md:w-auto">
                    <Clock size={16} className="mr-2" />
                    Schedule for Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Info Panel */}
          <div className="space-y-6">
            {/* Message Info */}
            <Card variant="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Message Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipients</p>
                      <p className="font-medium">{recipientCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Message Length</p>
                      <p className="font-medium">{characterCount} characters</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">SMS Count</p>
                      <p className="font-medium">{smsCount} messages</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium">{estimatedCost}</p>
                    </div>
                  </div>
                  
                  {recipientCount > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm">WhatsApp Eligible</p>
                        {isAnalyzing ? (
                          <Badge variant="outline">Analyzing...</Badge>
                        ) : (
                          <Badge variant="outline">
                            {whatsappEligible} of {recipientCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-start">
                          <Check size={14} className="text-green-500 mr-1 mt-0.5" />
                          <p>
                            Messages will be sent via WhatsApp when available (based on your channel preference)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Tips */}
            <Card variant="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <HelpCircle size={16} className="mr-2 text-primary" />
                  Tips for Better Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Include country code: </span>
                    Always include the country code (e.g., +1 for US).
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Avoid spam triggers: </span>
                    Words like "free", "urgent", and excessive punctuation.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Best time to send: </span>
                    8am-1pm for business, 5pm-8pm for promotional content.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Keep it short: </span>
                    Messages under 160 characters have better engagement.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Requirements */}
            <Card variant="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertCircle size={16} className="mr-2 text-warning" />
                  Important Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Opt-out option: </span>
                    Include STOP option for compliance with regulations.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Explicit consent: </span>
                    Ensure all recipients have given consent to receive messages.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Manual WhatsApp sending: </span>
                    WhatsApp messages require manual confirmation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SMSComposer;
