
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  BarChart3, ArrowLeft, ArrowUpRight, Calendar, Download, 
  TrendingUp, MessageSquare, Clock, CheckCircle2, XCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Sample data for analytics
const messageVolumeData = [
  { name: "Mon", sms: 65, whatsapp: 28 },
  { name: "Tue", sms: 78, whatsapp: 32 },
  { name: "Wed", sms: 102, whatsapp: 45 },
  { name: "Thu", sms: 145, whatsapp: 65 },
  { name: "Fri", sms: 98, whatsapp: 50 },
  { name: "Sat", sms: 56, whatsapp: 25 },
  { name: "Sun", sms: 38, whatsapp: 18 },
];

const deliveryStatusData = [
  { name: "Delivered", value: 82 },
  { name: "Failed", value: 8 },
  { name: "Pending", value: 10 },
];

const engagementData = [
  { name: "Jan", rate: 65 },
  { name: "Feb", rate: 68 },
  { name: "Mar", rate: 72 },
  { name: "Apr", rate: 70 },
  { name: "May", rate: 75 },
  { name: "Jun", rate: 82 },
];

const channelBreakdownData = [
  { name: "SMS", value: 65 },
  { name: "WhatsApp", value: 35 },
];

const messageTypeData = [
  { name: "Promotional", sms: 120, whatsapp: 45 },
  { name: "Transactional", sms: 85, whatsapp: 40 },
  { name: "Reminder", sms: 60, whatsapp: 30 },
  { name: "Alert", sms: 40, whatsapp: 15 },
  { name: "Other", sms: 18, whatsapp: 8 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const STATUS_COLORS = {
  "Delivered": "#10B981", // green
  "Failed": "#EF4444",    // red
  "Pending": "#F59E0B"    // amber
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7days");
  
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
                <BarChart3 size={12} className="mr-1" />
                Insights
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Monitor performance metrics and optimize your messaging strategy
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-[160px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="12months">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-1.5" />
              Export Data
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Messages */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    Past 7 days
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <MessageSquare size={20} className="text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs font-medium text-green-600">
                <TrendingUp size={14} className="mr-1" />
                <span>12.5% increase</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Delivery Rate */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">92.4%</div>
                  <p className="text-xs text-muted-foreground">
                    Past 7 days
                  </p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle2 size={20} className="text-green-500" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs font-medium text-green-600">
                <TrendingUp size={14} className="mr-1" />
                <span>1.2% increase</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Failure Rate */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">7.6%</div>
                  <p className="text-xs text-muted-foreground">
                    Past 7 days
                  </p>
                </div>
                <div className="p-2 bg-red-500/10 rounded-full">
                  <XCircle size={20} className="text-red-500" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs font-medium text-red-600">
                <TrendingUp size={14} className="mr-1 rotate-180" />
                <span>0.8% decrease</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Avg Response Time */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">5.2m</div>
                  <p className="text-xs text-muted-foreground">
                    Past 7 days
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Clock size={20} className="text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs font-medium text-green-600">
                <TrendingUp size={14} className="mr-1 rotate-180" />
                <span>0.5m faster</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Volume Over Time */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Message Volume</CardTitle>
                  <CardDescription>Message volume by channel over time</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  View Details
                  <ArrowUpRight size={12} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messageVolumeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sms" name="SMS" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="whatsapp" name="WhatsApp" fill="#25D366" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Delivery Status */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Delivery Status</CardTitle>
                  <CardDescription>Message delivery status breakdown</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  View Details
                  <ArrowUpRight size={12} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deliveryStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {deliveryStatusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Engagement Rate */}
          <Card variant="border" className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Engagement Rate</CardTitle>
                  <CardDescription>Message open rates over time</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  View Details
                  <ArrowUpRight size={12} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Engagement %"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Channel Breakdown */}
          <Card variant="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Channel Breakdown</CardTitle>
                  <CardDescription>Messages by platform</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  View Details
                  <ArrowUpRight size={12} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {channelBreakdownData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? "hsl(var(--primary))" : "#25D366"} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Message Types */}
        <Card variant="border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Message Types</CardTitle>
                <CardDescription>Distribution of messages by type and channel</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View Details
                <ArrowUpRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={messageTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sms" name="SMS" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="whatsapp" name="WhatsApp" fill="#25D366" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;
