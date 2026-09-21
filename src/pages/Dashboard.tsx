/**
 * Dashboard — live overview of messaging activity.
 */

import Layout from "@/components/Layout";
import StatsCard from "@/components/Dashboard/StatsCard";
import AIMessageCard from "@/components/Dashboard/AIMessageCard";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare, ArrowUpRight, BrainCircuit, Users,
  Calendar, Plus, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboard } from "@/hooks/useApi";
import { Reveal } from "@/lib/motion";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { data, isLoading } = useDashboard();
  const navigate = useNavigate();

  const stats = data?.stats;
  const statsData = [
    {
      title: "Total SMS Sent",
      value: isLoading ? "…" : String(stats?.totalSent ?? 0),
      description: "Last 30 days",
      icon: <MessageSquare size={16} className="text-primary" />,
    },
    {
      title: "AI-Generated",
      value: isLoading ? "…" : String(stats?.aiGenerated ?? 0),
      description: isLoading ? "of total" : `${stats?.aiShare ?? 0}% of total`,
      icon: <BrainCircuit size={16} className="text-primary" />,
    },
    {
      title: "Active Contacts",
      value: isLoading ? "…" : String(stats?.activeContacts ?? 0),
      description: isLoading ? "this week" : `${stats?.newContactsWeek ?? 0} new this week`,
      icon: <Users size={16} className="text-primary" />,
    },
    {
      title: "Scheduled",
      value: isLoading ? "…" : String(stats?.scheduledNext7 ?? 0),
      description: "Upcoming campaigns",
      icon: <Calendar size={16} className="text-primary" />,
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight font-display">Dashboard</h1>
            <p className="text-muted-foreground">
              {stats
                ? `${stats.messagesRemaining} of ${stats.messagesQuota} messages remaining on your plan`
                : "Overview of your SMS activity and analytics"}
            </p>
          </Reveal>
          <div className="flex items-center gap-4">
            <Link to="/ai-generator">
              <Button className="shadow-glow">
                <BrainCircuit className="mr-2 h-4 w-4" />
                New AI Message
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <Reveal key={stat.title} delay={index * 80}>
              <StatsCard {...stat} />
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Reveal className="lg:col-span-2" delay={80}>
            <Card variant="border" className="overflow-hidden card-aurora">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent — last 7 days</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[240px] pt-4">
                  {isLoading ? (
                    <div className="skeleton h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.daily ?? []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Bar dataKey="sent" name="Sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={160}>
            <Card variant="border" className="overflow-hidden h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Upcoming Scheduled</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => navigate("/scheduled")}>
                  View All
                  <ArrowUpRight size={12} className="ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}</div>
                ) : (data?.upcoming ?? []).length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Nothing scheduled yet</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/sms-composer")}>
                      <Clock size={14} className="mr-1" /> Schedule a campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(data?.upcoming ?? []).map((item) => (
                      <div key={item.id} className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <Badge variant={item.status === "scheduled" ? "success" : item.status === "paused" ? "warning" : "outline"} size="sm" className="ml-2">
                              {item.status === "scheduled" ? <Clock size={10} className="mr-1" /> : <AlertCircle size={10} className="mr-1" />}
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.recipients} recipients</p>
                          <p className="text-xs font-medium tabular">
                            {item.date
                              ? new Date(item.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                              : "Not scheduled"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/scheduled")}>
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium font-display">Recent AI-Generated Messages</h2>
            <Link to="/ai-generator">
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" />
                Create New
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-44" />)}
            </div>
          ) : (data?.recentMessages ?? []).length === 0 ? (
            <Card variant="border">
              <CardContent className="py-12 text-center">
                <BrainCircuit size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-xl font-medium mb-1 font-display">No AI messages yet</h3>
                <p className="text-muted-foreground mb-4">Generate your first message and it will appear here</p>
                <Button onClick={() => navigate("/ai-generator")}>
                  <BrainCircuit size={16} className="mr-1" /> Open AI Generator
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.recentMessages ?? []).map((message) => (
                <AIMessageCard
                  key={message.id}
                  title={message.title}
                  content={message.content}
                  model={message.model}
                  timestamp={formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  onUse={() => navigate("/sms-composer", { state: { prefill: message.content } })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
