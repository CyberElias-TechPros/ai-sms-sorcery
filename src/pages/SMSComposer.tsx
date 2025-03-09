
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ContactsSearch, { Contact } from "@/components/Contacts/ContactsSearch";
import MessageTemplate from "@/components/Messaging/MessageTemplate";
import { useToast } from "@/hooks/use-toast";
import { sendSms, scheduleMessage, MessageRecipient, MessageContent } from "@/utils/apiServices";
import { 
  MessageSquare, Calendar, Send, ArrowLeft, Plus, 
  Copy, Clock, ImagePlus, BrainCircuit, UploadCloud
} from "lucide-react";

// Sample templates
const sampleTemplates = [
  {
    id: "t1",
    title: "Appointment Reminder",
    content: "Hi {name}, this is a reminder for your appointment tomorrow at 2:00 PM. Please arrive 10 minutes early. Reply CONFIRM to confirm or call us to reschedule.",
    category: "reminder",
    createdAt: "2023-05-15T10:30:00Z",
    usageCount: 24
  },
  {
    id: "t2",
    title: "Product Launch",
    content: "Exciting news! Our new product line launches next week. Be first to shop with 15% off using code FIRST15. Early access opens Monday at 9AM. Don't miss out!",
    category: "marketing",
    createdAt: "2023-06-01T14:45:00Z",
    usageCount: 12,
    model: "GPT-4"
  },
  {
    id: "t3",
    title: "Order Confirmation",
    content: "Thank you for your order #{orderID}! Your items are being prepared for shipping. Track your delivery at example.com/track. Questions? Reply to this message.",
    category: "notification",
    createdAt: "2023-05-20T09:15:00Z",
    usageCount: 87
  }
];

const SMSComposer = () => {
  const [message, setMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("compose");
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const { toast } = useToast();
  
  const handleContactSelection = (contacts: Contact[]) => {
    setSelectedContacts(contacts);
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);
    setCharacterCount(text.length);
  };
  
  const useTemplate = (id: string, content: string) => {
    setMessage(content);
    setCharacterCount(content.length);
    
    toast({
      title: "Template Applied",
      description: "Message template has been applied to composer",
    });
    
    // Switch back to compose tab
    setSelectedTab("compose");
  };
  
  const handleSendMessage = async () => {
    // Validate
    if (!message.trim()) {
      toast({
        title: "Missing Message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedContacts.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }
    
    // Format recipients
    const recipients: MessageRecipient[] = selectedContacts.map((contact) => ({
      phoneNumber: contact.phoneNumber,
      name: contact.name
    }));
    
    // Create message content
    const content: MessageContent = {
      body: message
    };
    
    setIsSending(true);
    
    try {
      if (enableScheduling) {
        // Validate schedule datetime
        if (!scheduleDate || !scheduleTime) {
          toast({
            title: "Invalid Schedule",
            description: "Please select both date and time for scheduling",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }
        
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        
        if (scheduledDateTime <= new Date()) {
          toast({
            title: "Invalid Schedule",
            description: "Scheduled time must be in the future",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }
        
        // Schedule the message
        const scheduleId = await scheduleMessage(recipients, content, scheduledDateTime);
        
        if (scheduleId) {
          // Clear form after successful scheduling
          setMessage("");
          setSelectedContacts([]);
          setEnableScheduling(false);
          setScheduleDate("");
          setScheduleTime("");
        }
      } else {
        // Send immediately
        const success = await sendSms(recipients, content);
        
        if (success) {
          // Clear form after successful send
          setMessage("");
          setSelectedContacts([]);
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const getSmsCountEstimate = () => {
    // Standard SMS segment is 160 characters
    if (characterCount === 0) return 0;
    return Math.ceil(characterCount / 160);
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
              <Badge variant="outline" size="sm">
                <MessageSquare size={12} className="mr-1" />
                SMS
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Message Composer</h1>
            <p className="text-muted-foreground">
              Create and send SMS messages to your contacts
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/ai-generator">
              <Button variant="outline">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Use AI Generator
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Contact Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recipients</CardTitle>
              <CardDescription>
                Select contacts to receive your message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactsSearch 
                onSelectContacts={handleContactSelection}
                selectedContacts={selectedContacts}
                maxHeight="400px"
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>{selectedContacts.length} recipient{selectedContacts.length !== 1 ? 's' : ''} selected</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Right Column - Message Composer */}
          <div className="lg:col-span-3 space-y-6">
            {/* Message Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compose">Compose Message</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="compose" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Compose Message</CardTitle>
                    <CardDescription>
                      Create your SMS message
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Type your message here..."
                      value={message}
                      onChange={handleMessageChange}
                      className="min-h-[150px] resize-none"
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className={`${characterCount > 160 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {characterCount} character{characterCount !== 1 ? 's' : ''} 
                        {characterCount > 0 && ` (${getSmsCountEstimate()} SMS segment${getSmsCountEstimate() !== 1 ? 's' : ''})`}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" disabled={message.length === 0} onClick={() => setMessage("")}>
                          Clear
                        </Button>
                        <Button variant="ghost" size="sm" disabled={message.length === 0} onClick={() => {
                          navigator.clipboard.writeText(message);
                          toast({
                            title: "Copied to clipboard",
                            description: "Message copied to clipboard",
                          });
                        }}>
                          <Copy size={14} className="mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="media-toggle"
                          checked={mediaEnabled}
                          onCheckedChange={setMediaEnabled}
                        />
                        <Label htmlFor="media-toggle">Add Media (MMS)</Label>
                      </div>
                      
                      {mediaEnabled && (
                        <Button variant="outline" className="w-full">
                          <ImagePlus className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="schedule-toggle"
                          checked={enableScheduling}
                          onCheckedChange={setEnableScheduling}
                        />
                        <Label htmlFor="schedule-toggle">Schedule Message</Label>
                      </div>
                      
                      {enableScheduling && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md">
                          <div className="space-y-1">
                            <Label htmlFor="scheduleDate" className="text-xs">Date</Label>
                            <Input
                              id="scheduleDate"
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="scheduleTime" className="text-xs">Time</Label>
                            <Input
                              id="scheduleTime"
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {enableScheduling ? "Will be sent at scheduled time" : "Will be sent immediately"}
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      loading={isSending}
                      disabled={message.trim() === "" || selectedContacts.length === 0}
                    >
                      {!isSending && (
                        enableScheduling ? (
                          <>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Now
                          </>
                        )
                      )}
                      {enableScheduling ? "Schedule Message" : "Send Message"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="templates" className="pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Saved Templates</h3>
                    <Button size="sm">
                      <Plus size={14} className="mr-1" />
                      Create New Template
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sampleTemplates.map(template => (
                      <MessageTemplate
                        key={template.id}
                        {...template}
                        onUse={useTemplate}
                        onEdit={(id) => {
                          toast({
                            title: "Edit Template",
                            description: `Editing template: ${id}`,
                          });
                        }}
                        onDelete={(id) => {
                          toast({
                            title: "Template Deleted",
                            description: `Template has been deleted`,
                          });
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-center p-4 border border-dashed rounded-lg">
                    <Button variant="outline">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Import Templates
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SMSComposer;
