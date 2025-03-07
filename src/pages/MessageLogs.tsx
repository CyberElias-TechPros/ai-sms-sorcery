
import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { 
  MessageSquare, ArrowLeft, Search, Filter, CheckCircle2, AlertCircle, 
  XCircle, Download, RefreshCcw, MoreHorizontal, Clock, Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Sample message logs data
const messageLogsData = [
  { id: 1, recipient: "+1234567890", content: "Your appointment is confirmed for tomorrow at 10:00 AM.", status: "delivered", timestamp: "2023-06-10T10:30:00Z", channel: "sms" },
  { id: 2, recipient: "+2345678901", content: "Your order #12345 has shipped and will arrive in 2-3 business days.", status: "delivered", timestamp: "2023-06-10T09:45:00Z", channel: "whatsapp" },
  { id: 3, recipient: "+3456789012", content: "FLASH SALE! Get 30% off all products today only with code FLASH30.", status: "delivered", timestamp: "2023-06-10T08:15:00Z", channel: "sms" },
  { id: 4, recipient: "+4567890123", content: "Your payment of $49.99 has been processed. Thank you for your purchase!", status: "failed", timestamp: "2023-06-09T16:20:00Z", channel: "sms" },
  { id: 5, recipient: "+5678901234", content: "Your subscription will renew on June 15th. Reply STOP to cancel.", status: "pending", timestamp: "2023-06-09T14:10:00Z", channel: "sms" },
  { id: 6, recipient: "+6789012345", content: "Thank you for joining our loyalty program! Your ID is LYT123456.", status: "delivered", timestamp: "2023-06-09T11:30:00Z", channel: "whatsapp" },
  { id: 7, recipient: "+7890123456", content: "Your account password was reset. If you didn't request this, please contact support.", status: "delivered", timestamp: "2023-06-08T20:45:00Z", channel: "sms" },
  { id: 8, recipient: "+8901234567", content: "Your table reservation for 4 people at 8:00 PM tonight is confirmed.", status: "failed", timestamp: "2023-06-08T18:30:00Z", channel: "whatsapp" },
  { id: 9, recipient: "+9012345678", content: "We miss you! Come back and get 15% off your next purchase with code RETURN15.", status: "delivered", timestamp: "2023-06-08T15:20:00Z", channel: "sms" },
  { id: 10, recipient: "+0123456789", content: "Your flight #AB123 has been delayed by 1 hour. New departure time is 3:45 PM.", status: "delivered", timestamp: "2023-06-08T12:10:00Z", channel: "sms" },
];

const MessageLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter messages based on search query, status and channel filters
  const filteredLogs = messageLogsData.filter(log => {
    const matchesSearch = 
      log.recipient.includes(searchQuery) ||
      log.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ? true : log.status === statusFilter;
    const matchesChannel = channelFilter === "all" ? true : log.channel === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge variant="outline" className="bg-success/10 text-success">
            <CheckCircle2 size={10} className="mr-1" />
            Delivered
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning">
            <Clock size={10} className="mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            <XCircle size={10} className="mr-1" />
            Failed
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
  
  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "sms":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary">
            <MessageSquare size={10} className="mr-1" />
            SMS
          </Badge>
        );
      case "whatsapp":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            <MessageSquare size={10} className="mr-1" />
            WhatsApp
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
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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
                <MessageSquare size={12} className="mr-1" />
                Logs
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Message Logs</h1>
            <p className="text-muted-foreground">
              View and track all messages sent through the system
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-1.5" />
              Export Logs
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCcw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <Card variant="border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Message History</CardTitle>
                <CardDescription>
                  Recent messages sent to recipients
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8 h-9 w-[180px] sm:w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="h-9 w-[130px]">
                    <SelectValue placeholder="Filter by channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare size={48} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery || statusFilter !== "all" || channelFilter !== "all"
                    ? "No messages match your current filters. Try changing or clearing your filters."
                    : "No message history available yet. Send your first message to see logs here."}
                </p>
                {(searchQuery || statusFilter !== "all" || channelFilter !== "all") && (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setChannelFilter("all");
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Recipient</th>
                        <th className="px-4 py-3 text-left font-medium">Message</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Channel</th>
                        <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">
                            {log.recipient}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[300px]">
                            <p className="truncate">{log.content}</p>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(log.status)}
                          </td>
                          <td className="px-4 py-3">
                            {getChannelBadge(log.channel)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Resend Message</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Copy Message</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex items-center justify-between pt-6">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{filteredLogs.length}</span> of{" "}
              <span className="font-medium">{messageLogsData.length}</span> messages
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default MessageLogs;
