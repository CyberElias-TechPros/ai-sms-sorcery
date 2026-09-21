/**
 * Analytics — live delivery & volume insights from the message log.
 */

import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, ArrowLeft, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useApi";
import { Reveal } from "@/lib/motion";

const STATUS_COLORS = {
  delivered: "hsl(152 48% 52%)",
  sent: "hsl(174 62% 45%)",
  queued: "hsl(32 88% 60%)",
  sending: "hsl(32 88% 60%)",
  failed: "hsl(0 70% 58%)",
  cancelled: "hsl(240 8% 55%)",
} as Record<string, string>;

const PIE_COLORS = ["hsl(262 83% 68%)", "hsl(322 76% 62%)", "hsl(174 62% 45%)", "hsl(43 84% 60%)", "hsl(240 8% 55%)"];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7days");
  const { data, isLoading } = useAnalytics(timeRange);
  const totals = data?.totals;

  return (
    <Layout>
      <div className="space-y-8 page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-2"><ArrowLeft size={16} /></Button>
              </Link>
              <Badge variant="outline" size="sm"><BarChart3 size={12} className="mr-1" />Insights</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Analytics</h1>
            <p className="text-muted-foreground">Monitor delivery performance and messaging patterns</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-9 w-[160px]"><Calendar className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Reveal>
            <Card variant="border" className="card-aurora">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery rate</p>
                    <p className="text-3xl font-bold tabular font-display">{isLoading ? "…" : `${data?.deliveryRate ?? 0}%`}</p>
                  </div>
                  <CheckCircle2 className="text-success" size={22} />
                </div>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={80}>
            <Card variant="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total messages</p>
                    <p className="text-3xl font-bold tabular font-display">{isLoading ? "…" : totals?.total ?? 0}</p>
                  </div>
                  <Clock className="text-primary" size={22} />
                </div>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={160}>
            <Card variant="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-3xl font-bold tabular font-display">{isLoading ? "…" : totals?.failed ?? 0}</p>
                  </div>
                  <XCircle className="text-destructive" size={22} />
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Volume chart */}
        <Reveal>
          <Card variant="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Message volume</CardTitle>
              <CardDescription>SMS vs WhatsApp over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {isLoading ? <div className="skeleton h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.daily ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--popover-foreground))",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sms" name="SMS" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="hsl(var(--aurora-c))" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Reveal>
            <Card variant="border" className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delivery status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  {isLoading ? <div className="skeleton h-full" /> : (data?.byStatus ?? []).every((s) => s.value === 0) ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data in this range</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.byStatus ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                          {(data?.byStatus ?? []).map((entry) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "hsl(240 8% 55%)"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card variant="border" className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Channel split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] flex items-center justify-center">
                  {isLoading ? <div className="skeleton h-full w-full" /> : (data?.byChannel ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No data in this range</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.byChannel ?? []} dataKey="value" nameKey="name" outerRadius={85}>
                          {(data?.byChannel ?? []).map((entry, i) => (
                            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={160}>
            <Card variant="border" className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By message category</CardTitle>
                <CardDescription>From linked templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  {isLoading ? <div className="skeleton h-full" /> : (data?.byCategory ?? []).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data in this range</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.byCategory ?? []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
