/**
 * Scheduled campaigns — full lifecycle management (draft → scheduled → completed).
 */

import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui-custom/Badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, MessageSquare, MoreVertical,
  PauseCircle, PencilLine, PlayCircle, Search, Users, Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCampaigns, useCampaignAction, useDeleteCampaign, useUpdateCampaign, useCreateCampaign } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";
import type { Campaign } from "@/lib/types";
import ContactsSearch, { Contact } from "@/components/Contacts/ContactsSearch";

const Scheduled = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", body: "", date: "", time: "" });
  const [editRecipients, setEditRecipients] = useState<Contact[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "" });
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useMemo(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const { data, isLoading } = useCampaigns({ tab: activeTab, q: debouncedQuery || undefined });
  const campaignAction = useCampaignAction();
  const deleteCampaign = useDeleteCampaign();
  const updateCampaign = useUpdateCampaign();
  const createCampaign = useCreateCampaign();

  const items = data?.items ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="bg-primary/10 text-primary"><Clock size={10} className="mr-1" />Scheduled</Badge>;
      case "sending":
        return <Badge variant="outline" className="bg-warning/10 text-warning"><Loader2 size={10} className="mr-1 animate-spin" />Sending</Badge>;
      case "draft":
        return <Badge variant="outline" className="bg-warning/10 text-warning"><AlertCircle size={10} className="mr-1" />Draft</Badge>;
      case "paused":
        return <Badge variant="outline" className="bg-warning/10 text-warning"><PauseCircle size={10} className="mr-1" />Paused</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle2 size={10} className="mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline"><AlertCircle size={10} className="mr-1" />Cancelled</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive"><AlertCircle size={10} className="mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle size={10} className="mr-1" />{status}</Badge>;
    }
  };

  const runAction = async (id: string, action: Parameters<typeof campaignAction.mutateAsync>[0]["action"], body?: unknown, successMsg?: string) => {
    try {
      await campaignAction.mutateAsync({ id, action, body });
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  };

  const openEdit = (campaign: Campaign) => {
    setDetail(campaign);
    const d = campaign.scheduledAt ? new Date(campaign.scheduledAt) : null;
    setEditForm({
      title: campaign.title,
      body: campaign.body,
      date: d ? d.toISOString().slice(0, 10) : "",
      time: d ? d.toTimeString().slice(0, 5) : "",
    });
    setEditRecipients(
      campaign.recipients.map((r) => ({
        id: r.contactId ?? r.phoneNumber,
        name: r.name ?? r.phoneNumber,
        phoneNumber: r.phoneNumber,
        email: "",
        group: "",
        groupName: null,
        tags: [],
        notes: null,
        optedOut: false,
        createdAt: "",
        updatedAt: "",
      })),
    );
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!detail) return;
    try {
      const body: Record<string, unknown> = {
        title: editForm.title,
        body: editForm.body,
        recipients: editRecipients.map((c) => ({ contactId: /^\d+$/.test(c.id) || c.id.length > 20 ? c.id : undefined, phoneNumber: c.phoneNumber, name: c.name })),
      };
      if (editForm.date && editForm.time) {
        body.scheduledAt = new Date(`${editForm.date}T${editForm.time}`).toISOString();
      }
      await updateCampaign.mutateAsync({ id: detail.id, ...body } as never);
      toast.success("Campaign updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const openSchedule = (id: string) => {
    setSchedulingId(id);
    setScheduleForm({ date: "", time: "" });
    setScheduleOpen(true);
  };

  const confirmSchedule = async () => {
    if (!schedulingId || !scheduleForm.date || !scheduleForm.time) {
      toast.error("Pick a date and time");
      return;
    }
    const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    await runAction(schedulingId, "schedule", { scheduledAt: scheduledAt.toISOString() }, "Campaign scheduled");
    setScheduleOpen(false);
  };

  const confirmDelete = async (id: string) => {
    if (!confirm("Cancel and delete this campaign?")) return;
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Campaign deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
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
              <Badge variant="outline" size="sm"><Calendar size={12} className="mr-1" />Scheduling</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Scheduled Messages</h1>
            <p className="text-muted-foreground">Plan and manage upcoming campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button size="sm" onClick={() => navigate("/sms-composer")}>
              <Clock size={14} className="mr-1.5" /> Schedule New Message
            </Button>
          </div>
        </div>

        <Card variant="border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>Everything queued, paused or done</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search campaigns..."
                  className="pl-8 h-9 w-[180px] sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full max-w-md grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="paused">Paused</TabsTrigger>
                <TabsTrigger value="completed">Done</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="pt-6">
              <TabsContent value={activeTab} className="m-0">
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-32" />)}</div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar size={48} className="text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {searchQuery
                        ? `No campaigns matching "${searchQuery}"`
                        : "You don't have any campaigns here yet. Create one to get started."}
                    </p>
                    <Button onClick={() => navigate("/sms-composer")}>
                      <Clock size={16} className="mr-2" /> Schedule New Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg bg-card spotlight transition-all hover:shadow-subtle"
                        onMouseMove={(e) => {
                          const el = e.currentTarget;
                          const rect = el.getBoundingClientRect();
                          el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
                          el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
                        }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                          <div className="space-y-1 mb-4 sm:mb-0 min-w-0">
                            <div className="flex items-center space-x-3 flex-wrap">
                              <h3 className="font-medium text-lg">{campaign.title}</h3>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{campaign.body}</p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {!["completed", "cancelled", "sending", "failed"].includes(campaign.status) && (
                              <Button variant="outline" size="sm" className="h-8" onClick={() => openEdit(campaign)}>
                                <PencilLine size={14} className="mr-1.5" /> Edit
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetail(campaign)}>View Details</DropdownMenuItem>
                                {campaign.status === "scheduled" && (
                                  <DropdownMenuItem onClick={() => runAction(campaign.id, "pause", undefined, "Campaign paused")}>
                                    <PauseCircle size={14} className="mr-2" /> Pause
                                  </DropdownMenuItem>
                                )}
                                {campaign.status === "paused" && (
                                  <DropdownMenuItem onClick={() => runAction(campaign.id, "resume", undefined, "Campaign resumed")}>
                                    <PlayCircle size={14} className="mr-2" /> Resume
                                  </DropdownMenuItem>
                                )}
                                {campaign.status === "draft" && (
                                  <DropdownMenuItem onClick={() => openSchedule(campaign.id)}>
                                    <Clock size={14} className="mr-2" /> Schedule…
                                  </DropdownMenuItem>
                                )}
                                {!["sending", "completed", "cancelled"].includes(campaign.status) && (
                                  <DropdownMenuItem onClick={() => runAction(campaign.id, "send-now", undefined, "Campaign dispatched")}>
                                    <MessageSquare size={14} className="mr-2" /> Send Now
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    await campaignAction.mutateAsync({ id: campaign.id, action: "duplicate" });
                                    toast.success("Campaign duplicated as draft");
                                  } catch (err) {
                                    toast.error(err instanceof ApiError ? err.message : "Duplicate failed");
                                  }
                                }}>
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!["completed", "cancelled", "failed"].includes(campaign.status) ? (
                                  <DropdownMenuItem className="text-destructive" onClick={() => runAction(campaign.id, "cancel", undefined, "Campaign cancelled")}>
                                    Cancel Schedule
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(campaign.id)}>
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <Separator />

                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Scheduled Time</p>
                            <p className="font-medium tabular">
                              {campaign.scheduledAt
                                ? new Date(campaign.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                                : "Not scheduled"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Recipients</p>
                            <p className="font-medium flex items-center tabular">
                              {campaign.totalRecipients}
                              <Users size={14} className="text-muted-foreground ml-1" />
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sent / Failed</p>
                            <p className="font-medium tabular">{campaign.sentCount} / {campaign.failedCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Channel</p>
                            <p className="font-medium uppercase">{campaign.channel}</p>
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

      {/* Detail dialog */}
      <Dialog open={!!detail && !editOpen} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>Campaign details</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/60 p-4 text-sm whitespace-pre-wrap">{detail.body}</div>
              <div className="flex items-center gap-2 flex-wrap">
                {detail.recipients.slice(0, 8).map((r, i) => (
                  <Badge key={`${r.phoneNumber}-${i}`} variant="secondary">{r.name || r.phoneNumber}</Badge>
                ))}
                {detail.recipients.length > 8 && <span className="text-xs text-muted-foreground">+{detail.recipients.length - 8} more</span>}
              </div>
              <div className="text-sm tabular text-muted-foreground">
                {detail.sentCount} sent · {detail.failedCount} failed · {detail.totalRecipients} total
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Input value={editForm.body} onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} className="tabular" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={editForm.time} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))} className="tabular" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <ContactsSearch
                onSelectContacts={(contacts) => setEditRecipients(contacts)}
                selectedContacts={editRecipients}
                maxHeight="180px"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateCampaign.isPending}>
              {updateCampaign.isPending && <Loader2 size={14} className="mr-1 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Schedule Campaign</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} className="tabular" />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))} className="tabular" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={confirmSchedule}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Scheduled;
