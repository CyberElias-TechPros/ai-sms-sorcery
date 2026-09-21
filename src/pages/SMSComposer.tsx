/**
 * SMS Composer — compose, personalize and send/schedule messages live.
 */

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ContactsSearch, { Contact } from "@/components/Contacts/ContactsSearch";
import MessageTemplate from "@/components/Messaging/MessageTemplate";
import { toast } from "sonner";
import { useSendMessages, useCreateCampaign, useTemplates, useTemplateUsage } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";
import {
  MessageSquare, Calendar, Send, ArrowLeft, Copy, Clock, BrainCircuit, Loader2,
} from "lucide-react";

const SMSComposer = () => {
  const [message, setMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("compose");
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [title, setTitle] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const { data: templatesData, isLoading: templatesLoading } = useTemplates();
  const templateUsage = useTemplateUsage();
  const sendMessages = useSendMessages();
  const createCampaign = useCreateCampaign();

  // Prefill from AI generator / dashboard "use" actions
  useEffect(() => {
    const state = location.state as { prefill?: string } | null;
    if (state?.prefill) {
      setMessage(state.prefill);
      toast.success("Message loaded into composer");
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const characterCount = message.length;

  const getSmsCountEstimate = () => {
    if (characterCount === 0) return 0;
    const isAscii = [...message].every((c) => c.charCodeAt(0) < 128);
    const single = isAscii ? 160 : 70;
    const multi = isAscii ? 153 : 67;
    return characterCount <= single ? 1 : Math.ceil(characterCount / multi);
  };

  const useTemplate = (id: string, content: string) => {
    setMessage(content);
    templateUsage.mutate(id);
    toast.success("Template applied to composer");
    setSelectedTab("compose");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to send");
      return;
    }
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    const recipients = selectedContacts.map((c) => ({
      contactId: c.id,
      phoneNumber: c.phoneNumber,
      name: c.name,
    }));

    try {
      if (enableScheduling) {
        if (!scheduleDate || !scheduleTime) {
          toast.error("Please select both date and time for scheduling");
          return;
        }
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        if (new Date(scheduledAt) <= new Date()) {
          toast.error("Scheduled time must be in the future");
          return;
        }
        await createCampaign.mutateAsync({
          title: title || `Campaign — ${new Date(scheduledAt).toLocaleDateString()}`,
          body: message,
          channel: "sms",
          recipients,
          scheduledAt,
          mediaUrl: mediaUrl || undefined,
        });
        toast.success("Message scheduled successfully");
        setTimeout(() => navigate("/scheduled"), 900);
      } else {
        const result = await sendMessages.mutateAsync({
          body: message,
          recipients,
          channel: "sms",
          mediaUrl: mediaUrl || undefined,
          idempotencyKey: crypto.randomUUID(),
        });
        const delivered = result.messages.filter((m) => ["delivered", "sent"].includes(m.status)).length;
        const failed = result.messages.filter((m) => m.status === "failed").length;
        toast.success(`Message sent to ${result.count} recipient${result.count !== 1 ? "s" : ""}${failed ? ` (${failed} failed)` : ""}`);
        if (result.compliance.footerAppended) {
          toast.info("Opt-out footer was appended for compliance");
        }
        if (result.skippedOptedOut > 0) {
          toast.warning(`${result.skippedOptedOut} recipient(s) skipped — opted out`);
        }
        setTimeout(() => navigate("/message-logs"), 900);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "An error occurred while processing your request");
    }
  };

  const isSending = sendMessages.isPending || createCampaign.isPending;

  return (
    <Layout>
      <div className="space-y-8 page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-2"><ArrowLeft size={16} /></Button>
              </Link>
              <Badge variant="outline" size="sm"><MessageSquare size={12} className="mr-1" />SMS</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Message Composer</h1>
            <p className="text-muted-foreground">Write once — reach everyone who matters</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/ai-generator">
              <Button variant="outline"><BrainCircuit className="mr-2 h-4 w-4" /> Use AI Generator</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Recipients</CardTitle>
              <CardDescription>Select who will receive this message</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactsSearch onSelectContacts={setSelectedContacts} selectedContacts={selectedContacts} maxHeight="380px" />
              <div className="mt-4 text-sm text-muted-foreground tabular">
                {selectedContacts.length} recipient{selectedContacts.length !== 1 ? "s" : ""} selected
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compose">Compose Message</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="compose" className="space-y-4 pt-4">
                <Card className="card-aurora">
                  <CardHeader>
                    <CardTitle className="text-base">Compose Message</CardTitle>
                    <CardDescription>SMS is delivered instantly — WhatsApp opens a send flow per recipient</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {enableScheduling && (
                      <div className="space-y-2">
                        <Label htmlFor="campaign-title">Campaign title</Label>
                        <Input id="campaign-title" placeholder="Monthly Newsletter" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                    )}
                    <Textarea
                      placeholder="Type your message here…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[150px] resize-none text-base"
                    />

                    <div className="flex items-center justify-between text-sm">
                      <div className={characterCount > 160 ? "text-warning tabular" : "text-muted-foreground tabular"}>
                        {characterCount} character{characterCount !== 1 ? "s" : ""}
                        {characterCount > 0 && ` · ${getSmsCountEstimate()} SMS segment${getSmsCountEstimate() !== 1 ? "s" : ""}`}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" disabled={!message} onClick={() => setMessage("")}>Clear</Button>
                        <Button variant="ghost" size="sm" disabled={!message} onClick={() => { navigator.clipboard.writeText(message); toast.success("Copied"); }}>
                          <Copy size={14} className="mr-1" /> Copy
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Switch id="media" checked={showMedia} onCheckedChange={setShowMedia} />
                        <Label htmlFor="media" className="text-sm">MMS media URL (optional)</Label>
                      </div>
                    </div>
                    {showMedia && (
                      <Input placeholder="https://… (https only)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
                    )}

                    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Switch id="scheduling" checked={enableScheduling} onCheckedChange={setEnableScheduling} />
                        <Label htmlFor="scheduling" className="text-sm">Schedule for later</Label>
                      </div>
                      {enableScheduling && (
                        <div className="flex items-center gap-2">
                          <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-8 w-[150px] tabular" />
                          <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-8 w-[110px] tabular" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    size="lg"
                    className="shadow-glow"
                    onClick={handleSendMessage}
                    disabled={isSending || !message || selectedContacts.length === 0}
                  >
                    {isSending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : enableScheduling ? (
                      <Clock className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {enableScheduling ? `Schedule for ${selectedContacts.length || 0}` : `Send to ${selectedContacts.length || 0}`}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="pt-4">
                {templatesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-52" />)}
                  </div>
                ) : (templatesData?.items ?? []).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-medium mb-1 font-display">No templates found</h3>
                      <p className="text-muted-foreground mb-4">Create your first template to reuse it here</p>
                      <Link to="/message-templates"><Button>Create Template</Button></Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(templatesData?.items ?? []).map((template) => (
                      <MessageTemplate
                        key={template.id}
                        id={template.id}
                        title={template.title}
                        content={template.content}
                        category={template.category}
                        createdAt={template.createdAt}
                        usageCount={template.usageCount}
                        model={template.model ?? undefined}
                        onUse={useTemplate}
                        showActions={false}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SMSComposer;
