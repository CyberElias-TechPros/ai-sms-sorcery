/**
 * Message Logs — live delivery log with filters, pagination, detail, resend, export.
 */

import Layout from "@/components/Layout";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import {
  MessageSquare, ArrowLeft, Search, CheckCircle2, AlertCircle,
  XCircle, Download, RefreshCcw, MoreHorizontal, Clock, Smartphone,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Link } from "react-router-dom";
import { useMessages, useResendMessage, useCancelMessage, MessageFilters } from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import type { Message } from "@/lib/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_BADGES: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  delivered: { label: "Delivered", variant: "text-success bg-success/10", icon: <CheckCircle2 size={10} className="mr-1" /> },
  sent: { label: "Sent", variant: "text-success bg-success/10", icon: <CheckCircle2 size={10} className="mr-1" /> },
  queued: { label: "Queued", variant: "text-warning bg-warning/10", icon: <Clock size={10} className="mr-1" /> },
  sending: { label: "Sending", variant: "text-warning bg-warning/10", icon: <Clock size={10} className="mr-1" /> },
  pending: { label: "Pending", variant: "text-warning bg-warning/10", icon: <Clock size={10} className="mr-1" /> },
  failed: { label: "Failed", variant: "text-destructive bg-destructive/10", icon: <XCircle size={10} className="mr-1" /> },
  cancelled: { label: "Cancelled", variant: "text-muted-foreground bg-muted", icon: <AlertCircle size={10} className="mr-1" /> },
};

/** Friendly provider names — device hand-offs read differently from cloud gateways. */
const providerLabel = (p: string) =>
  p === "phone-uri" ? "Your SIM (phone hand-off)" :
  p === "whatsapp-deeplink" ? "WhatsApp (phone hand-off)" :
  p === "sandbox" ? "Sandbox (simulated)" : p;

const isDeviceProvider = (p: string) => p === "phone-uri" || p === "whatsapp-deeplink";

const MessageLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Message | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const qc = useQueryClient();

  // Debounce search input
  useMemo(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filters: MessageFilters = {
    q: debouncedQuery || undefined,
    status: statusFilter,
    channel: channelFilter,
    page,
    pageSize: 15,
  };
  const { data, isLoading, refetch } = useMessages(filters);
  const resend = useResendMessage();
  const cancelMsg = useCancelMessage();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 15));

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(dateString));

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setChannelFilter("all");
    setPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleExport = async () => {
    try {
      const result = await api.exportMessages();
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `message_logs_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} messages`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resend.mutateAsync(id);
      toast.success("Message resent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Resend failed");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMsg.mutateAsync(id);
      toast.success("Queued message cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cancel failed");
    }
  };

  /** Mirror what really happened on the device (device sends, or corrections). */
  const handleMark = async (id: string, status: "sent" | "delivered" | "failed" | "cancelled") => {
    try {
      const updated = await api.markMessage(id, status);
      setDetail(updated);
      qc.invalidateQueries();
      toast.success(`Marked ${status}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const copyBody = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Message copied");
  };

  return (
    <Layout>
      <div className="space-y-8 page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-2"><ArrowLeft size={16} /></Button>
              </Link>
              <Badge variant="outline" size="sm"><MessageSquare size={12} className="mr-1" />Logs</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Message Logs</h1>
            <p className="text-muted-foreground">Every message sent through Sorcery, with live delivery status</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} className="mr-1.5" /> Export Logs
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCcw size={14} className={`mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        <Card variant="border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Message History</CardTitle>
                <CardDescription>Recent messages sent to recipients</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8 h-9 w-[180px] sm:w-[200px]"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Channel" /></SelectTrigger>
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
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14" />)}</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare size={48} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery || statusFilter !== "all" || channelFilter !== "all"
                    ? "No messages match your current filters. Try changing or clearing your filters."
                    : "No message history yet. Send your first message to see logs here."}
                </p>
                {searchQuery || statusFilter !== "all" || channelFilter !== "all" ? (
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                ) : (
                  <Link to="/sms-composer"><Button>Compose a message</Button></Link>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
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
                    {items.map((log) => {
                      const badge = STATUS_BADGES[log.status] ?? STATUS_BADGES.queued;
                      return (
                        <tr key={log.id} className="border-b hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-medium tabular">{log.toName || log.recipient}</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[300px]">
                            <p className="truncate">{log.content}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={badge.variant}>{badge.icon}{badge.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={log.channel === "whatsapp" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}>
                              <MessageSquare size={10} className="mr-1" />
                              {log.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground tabular">{formatDate(log.timestamp)}</td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetail(log)}>View Details</DropdownMenuItem>
                                {["failed", "cancelled"].includes(log.status) && (
                                  <DropdownMenuItem onClick={() => handleResend(log.id)}>Resend Message</DropdownMenuItem>
                                )}
                                {log.status === "queued" && (
                                  <DropdownMenuItem onClick={() => handleCancel(log.id)}>Cancel Send</DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => copyBody(log.content)}>Copy Message</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-6">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium tabular">{items.length}</span> of{" "}
              <span className="font-medium tabular">{total}</span> messages
            </div>
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 text-sm tabular">{page} / {totalPages}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardFooter>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message details</DialogTitle>
            <DialogDescription className="tabular">{detail?.recipient}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/60 p-4 text-sm whitespace-pre-wrap">{detail.content}</div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{detail.status}</dd></div>
                <div><dt className="text-muted-foreground">Channel</dt><dd className="font-medium uppercase">{detail.channel}</dd></div>
                <div>
                  <dt className="text-muted-foreground">Provider</dt>
                  <dd className="font-medium flex items-center gap-1.5">
                    {isDeviceProvider(detail.provider) && <Smartphone size={13} className="text-primary" />}
                    {providerLabel(detail.provider)}
                  </dd>
                </div>
                <div><dt className="text-muted-foreground">Segments</dt><dd className="font-medium tabular">{detail.segments}</dd></div>
                <div><dt className="text-muted-foreground">Created</dt><dd className="font-medium tabular">{formatDate(detail.createdAt)}</dd></div>
                <div><dt className="text-muted-foreground">Sent</dt><dd className="font-medium tabular">{detail.sentAt ? formatDate(detail.sentAt) : "—"}</dd></div>
                {detail.error && (
                  <div className="col-span-2"><dt className="text-muted-foreground">Error</dt><dd className="text-destructive">{detail.error}</dd></div>
                )}
              </dl>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => copyBody(detail.content)}>Copy</Button>
                {["queued", "sending", "sent"].includes(detail.status) && (
                  <Button variant="outline" size="sm" onClick={() => handleMark(detail.id, "delivered")}>
                    Mark delivered
                  </Button>
                )}
                {detail.status !== "failed" && detail.status !== "cancelled" && (
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleMark(detail.id, "failed")}>
                    Mark failed
                  </Button>
                )}
                <Button size="sm" onClick={() => handleResend(detail.id)}>Resend</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MessageLogs;
