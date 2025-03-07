
import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { 
  Calendar, ArrowLeft, Search, Filter, Clock, MoreVertical, 
  CheckCircle2, AlertCircle, PencilLine, Users, MessageSquare, PauseCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Sample scheduled messages data
const scheduledMessages = [
  { 
    id: 1, 
    title: "Monthly Newsletter", 
    content: "Don't miss our latest updates and offers! Check out our new arrivals and exclusive deals for this month.",
    recipients: 245, 
    status: "scheduled", 
    date: "Tomorrow, 9:00 AM",
    channel: "sms"
  },
  { 
    id: 2, 
    title: "Flash Sale Announcement", 
    content: "FLASH SALE ALERT! Get 30% off all products for the next 24 hours. Shop now using code FLASH30 at checkout.",
    recipients: 128, 
    status: "scheduled", 
    date: "Jun 15, 12:00 PM",
    channel: "both"
  },
  { 
    id: 3, 
    title: "Product Launch", 
    content: "Exciting news! Our new product line is launching next week. Be among the first to experience the innovation.",
    recipients: 82, 
    status: "draft", 
    date: "Not scheduled",
    channel: "whatsapp"
  },
  { 
    id: 4, 
    title: "Appointment Reminders", 
    content: "This is a reminder about your upcoming appointment. Please confirm your attendance by replying CONFIRM.",
    recipients: 56, 
    status: "paused", 
    date: "Every Monday, 8:00 AM",
    channel: "sms"
  },
  { 
    id: 5, 
    title: "Customer Feedback Request", 
    content: "We value your opinion! Please take a moment to share your feedback on your recent purchase by clicking this link.",
    recipients: 189, 
    status: "completed", 
    date: "Sent on Jun 5, 10:00 AM",
    channel: "both"
  },
];

const Scheduled = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter messages based on search query and active tab
  const filteredMessages = scheduledMessages.filter(message => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ? true :
      activeTab === "drafts" ? message.status === "draft" :
      activeTab === "scheduled" ? message.status === "scheduled" :
      activeTab === "paused" ? message.status === "paused" :
      activeTab === "completed" ? message.status === "completed" : true;
    
    return matchesSearch && matchesTab;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary">
            <Clock size={10} className="mr-1" />
            Scheduled
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <PencilLine size={10} className="mr-1" />
            Draft
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning">
            <PauseCircle size={10} className="mr-1" />
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-success/10 text-success">
            <CheckCircle2 size={10} className="mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle size={10} className="mr-1" />
            Unknown
          </Badge>
        );
    }
  };
  
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "sms":
        return (
          <div className="flex items-center" title="SMS">
            <MessageSquare size={14} className="text-primary" />
          </div>
        );
      case "whatsapp":
        return (
          <div className="flex items-center" title="WhatsApp">
            <MessageSquare size={14} className="text-green-500" />
          </div>
        );
      case "both":
        return (
          <div className="flex items-center space-x-1" title="SMS & WhatsApp">
            <MessageSquare size={14} className="text-primary" />
            <MessageSquare size={14} className="text-green-500" />
          </div>
        );
      default:
        return null;
    }
  };

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
                <Calendar size={12} className="mr-1" />
                Scheduling
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Scheduled Messages</h1>
            <p className="text-muted-foreground">
              Plan and manage your upcoming message campaigns
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button size="sm">
              <Clock size={14} className="mr-1.5" />
              Schedule New Message
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <Card variant="border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Scheduled Campaigns</CardTitle>
                <CardDescription>View and manage your scheduled message campaigns</CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8 h-9 w-[180px] sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3">
                  <Filter size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-6">
              <TabsList className="grid w-full max-w-md grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="paused">Paused</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="pt-6">
              <TabsContent value={activeTab} className="m-0">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar size={48} className="text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No messages found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {searchQuery 
                        ? `No messages matching "${searchQuery}"`
                        : "You don't have any scheduled messages. Create your first campaign to get started."}
                    </p>
                    <Button>
                      <Clock size={16} className="mr-2" />
                      Schedule New Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                          <div className="space-y-1 mb-4 sm:mb-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-lg">{message.title}</h3>
                              {getStatusBadge(message.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {message.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {message.status !== "completed" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8"
                              >
                                <PencilLine size={14} className="mr-1.5" />
                                Edit
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                {message.status === "scheduled" && (
                                  <DropdownMenuItem>Pause Schedule</DropdownMenuItem>
                                )}
                                {message.status === "paused" && (
                                  <DropdownMenuItem>Resume Schedule</DropdownMenuItem>
                                )}
                                {message.status === "draft" && (
                                  <DropdownMenuItem>Schedule Now</DropdownMenuItem>
                                )}
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Cancel Schedule
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Scheduled Time</p>
                            <p className="font-medium">{message.date}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Recipients</p>
                            <div className="font-medium flex items-center space-x-1">
                              <span>{message.recipients}</span>
                              <Users size={14} className="text-muted-foreground ml-1" />
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Channel</p>
                            <div className="font-medium flex items-center space-x-1 pt-1">
                              {getChannelIcon(message.channel)}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created By</p>
                            <p className="font-medium">Admin User</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default Scheduled;
