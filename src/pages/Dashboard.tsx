
import Layout from "@/components/Layout";
import StatsCard from "@/components/Dashboard/StatsCard";
import AIMessageCard from "@/components/Dashboard/AIMessageCard";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Link } from "react-router-dom";
import { 
  MessageSquare, ArrowUpRight, BrainCircuit, Users, 
  Calendar, Plus, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Sample data for the dashboard
const statsData = [
  { title: "Total SMS Sent", value: "1,248", description: "Last 30 days", icon: <MessageSquare size={16} className="text-primary" />, trend: { value: 12.5, positive: true } },
  { title: "AI-Generated", value: "643", description: "51% of total", icon: <BrainCircuit size={16} className="text-primary" /> },
  { title: "Active Contacts", value: "328", description: "12 new this week", icon: <Users size={16} className="text-primary" />, trend: { value: 4.2, positive: true } },
  { title: "Scheduled", value: "24", description: "For next 7 days", icon: <Calendar size={16} className="text-primary" /> },
];

const recentMessages = [
  { 
    id: 1,
    title: "Summer Sale Promotion",
    content: "Get 25% off all summer items! Limited time offer until July 31st. Shop now with code SUMMER25 at checkout. Reply STOP to unsubscribe.",
    model: "GPT-4",
    timestamp: "2 hours ago"
  },
  { 
    id: 2,
    title: "Webinar Reminder",
    content: "REMINDER: Your webinar 'Digital Marketing Trends 2023' starts in 24 hours. Check your email for joining instructions or reply INFO for assistance.",
    model: "Claude",
    timestamp: "Yesterday"
  },
  { 
    id: 3,
    title: "Appointment Confirmation",
    content: "Your appointment with Dr. Smith is confirmed for Monday, June 12 at 2:00 PM. Reply CONFIRM to confirm or RESCHEDULE to change your appointment.",
    model: "Gemini",
    timestamp: "3 days ago"
  }
];

const upcomingScheduled = [
  { id: 1, title: "Monthly Newsletter", recipients: 245, status: "scheduled", date: "Tomorrow, 9:00 AM" },
  { id: 2, title: "Discount Promotion", recipients: 128, status: "scheduled", date: "Jun 15, 12:00 PM" },
  { id: 3, title: "Event Reminder", recipients: 52, status: "draft", date: "Not scheduled" },
];

const messageSentData = [
  { name: "Mon", sent: 65 },
  { name: "Tue", sent: 78 },
  { name: "Wed", sent: 102 },
  { name: "Thu", sent: 145 },
  { name: "Fri", sent: 98 },
  { name: "Sat", sent: 56 },
  { name: "Sun", sent: 38 },
];

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your SMS activity and analytics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/ai-generator">
              <Button>
                <BrainCircuit className="mr-2 h-4 w-4" />
                New AI Message
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <StatsCard 
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
              className={`animate-delay-${index * 100}`}
            />
          ))}
        </div>
        
        {/* Middle Section - Messages Chart & Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Chart */}
          <Card variant="border" className="overflow-hidden lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Messages Sent
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[240px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messageSentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }} 
                    />
                    <Bar 
                      dataKey="sent" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      barSize={24} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Scheduled */}
          <Card variant="border" className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Upcoming Scheduled
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View All
                <ArrowUpRight size={12} className="ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                {upcomingScheduled.map((item) => (
                  <div key={item.id} className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <Badge 
                          variant={item.status === "scheduled" ? "success" : "warning"}
                          size="sm" 
                          className="ml-2"
                        >
                          {item.status === "scheduled" ? (
                            <Clock size={10} className="mr-1" />
                          ) : (
                            <AlertCircle size={10} className="mr-1" />
                          )}
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.recipients} recipients</p>
                      <p className="text-xs font-medium">{item.date}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      {item.status === "scheduled" ? "Edit" : "Schedule"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent AI-Generated Messages */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent AI-Generated Messages</h2>
            <Link to="/ai-generator">
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" />
                Create New
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMessages.map((message) => (
              <AIMessageCard
                key={message.id}
                title={message.title}
                content={message.content}
                model={message.model}
                timestamp={message.timestamp}
                onUse={() => console.log("Use message:", message.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
