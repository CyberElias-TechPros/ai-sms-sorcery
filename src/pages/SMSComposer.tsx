import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, ChevronDown, Info, MessageSquare, Paperclip, Send, Smartphone, Users, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui-custom/Badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSendMessages, useCreateCampaign, useTemplates, useTemplateUsage } from "@/hooks/useApi";
import { useSendQueue } from "@/hooks/useSendQueue";
import { getHourlySendState, isMobileDevice } from "@/lib/smsUri";
import DeviceSendQueue from "@/components/Messaging/DeviceSendQueue";
import { ApiError } from "@/lib/api";
import { useContacts } from "@/hooks/useApi";

const DaySectionMessage = ({ className = "" }) => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M30 5C20.06 5 12 12.16 12 21C12 25.66 14.4 29.8 18.1 32.6C18.04 33.72 17.66 34.9 17 35.9C16.14 37.2 14.94 38.1 13.6 38.4C13.2 38.5 13 38.9 13.1 39.3C13.2 39.7 13.6 39.9 14 39.8C17.1 39.2 19.6 37.7 21.4 35.6C22.6 36.1 23.9 36.4 25.2 36.6C24.2 38.2 22.6 39.6 20.6 40.5C20.2 40.7 20 41.1 20.1 41.5C20.2 41.9 20.6 42.1 21 42C24.3 41.3 27 39.7 28.9 37.3C29.4 36.7 29.8 36 30 35.3C30.2 36 30.6 36.7 31.1 37.3C33 39.7 35.7 41.3 39 42C39.4 42.1 39.8 41.9 39.9 41.5C40 41.1 39.8 40.7 39.4 40.5C37.4 39.6 35.8 38.2 34.8 36.6C36.1 36.4 37.4 36.1 38.6 35.6C40.4 37.7 42.9 39.2 46 39.8C46.4 39.9 46.8 39.7 46.9 39.3C47 38.9 46.8 38.5 46.4 38.4C45.06 38.1 43.86 37.2 43 35.9C42.34 34.9 41.96 33.72 41.9 32.6C45.6 29.8 48 25.66 48 21C48 12.16 39.94 5 30 5Z"
      fill="url(#msg_gradient)"
    />
    <defs>
      <linearGradient id="msg_gradient" x1="12" y1="5" x2="48" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(var(--accent))" />
      </linearGradient>
    </defs>
  </svg>
);

const emptyFormValues = {
  title: "",
  message: "",
  mediaUrl: "",
};

const SMSComposer = () => {
  const navigate = useNavigate();
  const sendMessages = useSendMessages();
  const createCampaign = useCreateCampaign();
  const { data: templatesData } = useTemplates();
  const templateUsage = useTemplateUsage();
  const { data: contactsData } = useContacts({ pageSize: 200 });
  const sendQueue = useSendQueue();
  const [queueOpen, setQueueOpen] = useState(false);
  const hourly = getHourlySendState();

  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "both">("sms");
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openContacts, setOpenContacts] = useState(false);

  const contacts = contactsData?.items || [];
  const templates = templatesData?.items || [];
  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0;
  const charCount = message.length;

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.includes(searchTerm)
  );

  const toggleContact = (contact) => {
    setSelectedContacts((prev) =>
      prev.find((c) => c.id === contact.id)
        ? prev.filter((c) => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.content);
      if (!title) setTitle(template.title);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      await templateUsage.mutateAsync(templateId);
    } catch (err) {
      console.warn("Failed to track template usage:", err);
    }
  };

  useEffect(() => {
    if (selectedTemplate) {
      handleUseTemplate(selectedTemplate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  /** Shared validation + recipient mapping. Returns null (and toasts) when invalid. */
  const prepare = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return null;
    }
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one recipient");
      return null;
    }
    const invalid = selectedContacts.find((c) => !c.phoneNumber.match(/^\+?[1-9]\d{1,14}$/));
    if (invalid) {
      toast.error(`Invalid phone number for ${invalid.name}`);
      return null;
    }
    return selectedContacts.map((c) => ({
      contactId: c.id,
      phoneNumber: c.phoneNumber,
      name: c.name,
    }));
  };

  /**
   * PRIMARY PATH — local device send via the phone itself.
   * Stages the batch server-side (via: 'device' — no cloud quota), then walks
   * the queue with the phone's own SMS/WhatsApp composer: one recipient at a
   * time, manual on-device confirm, spam-safe pacing.
   */
  const handleDeviceSend = async () => {
    const recipients = prepare();
    if (!recipients) return;

    const nameByPhone = new Map(selectedContacts.map((c) => [c.phoneNumber, c.name]));
    try {
      const result = await sendMessages.mutateAsync({
        body: message,
        recipients,
        channel,
        via: "device",
        idempotencyKey: crypto.randomUUID(),
      });
      const items = result.messages.map((m) => ({
        messageId: m.id,
        name: m.toName || nameByPhone.get(m.recipient) || m.recipient,
        phone: m.recipient,
        channel: (m.channel === "whatsapp" ? "whatsapp" : "sms") as "sms" | "whatsapp",
      }));
      sendQueue.start({ body: message, recipients: items });
      setQueueOpen(true);
      toast.success(`${items.length} message${items.length !== 1 ? "s" : ""} staged — walk the queue phone-in-hand`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "An error occurred while processing your request");
    }
  };

  /** Optional path — cloud provider dispatch (or scheduled campaign). */
  const handleSendMessage = async () => {
    const recipients = prepare();
    if (!recipients) return;

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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover-lift"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <DaySectionMessage className="text-primary" />
              Compose Message
            </h1>
            <p className="text-muted-foreground mt-1">Send bulk messages from your own SIM — no gateway required</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-ritual">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Recipients</p>
              <p className="text-2xl font-display font-bold tabular">{selectedContacts.length}</p>
            </CardContent>
          </Card>
          <Card className="card-ritual">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Words</p>
              <p className="text-2xl font-display font-bold tabular">{wordCount}</p>
            </CardContent>
          </Card>
          <Card className="card-ritual">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Characters</p>
              <p className="text-2xl font-display font-bold tabular">{charCount}</p>
            </CardContent>
          </Card>
          <Card className="card-ritual">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">SMS Parts</p>
              <p className="text-2xl font-display font-bold tabular">{Math.ceil(charCount / 160) || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Message Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-ritual">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl">
                  <MessageSquare size={24} className="text-primary" />
                  Message Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Flash Sale Announcement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                {/* Template Selector */}
                <div>
                  <Label>Use Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="mt-1.5 resize-none"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{wordCount} words • {charCount} characters</span>
                    <span>Approx. {Math.ceil(charCount / 160) || 0} SMS part(s)</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="media" className="flex items-center gap-2">
                    <Paperclip size={14} />
                    Media URL (for MMS/WhatsApp)
                  </Label>
                  <Input
                    id="media"
                    placeholder="https://example.com/image.jpg"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recipients Card */}
            <Card className="card-ritual">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl">
                  <Users size={24} className="text-primary" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover open={openContacts} onOpenChange={setOpenContacts}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {selectedContacts.length > 0
                          ? `${selectedContacts.length} contact(s) selected`
                          : "Select contacts..."}
                      </span>
                      <ChevronDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="start">
                    <div className="p-3 border-b">
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleContact(contact)}
                        >
                          <Checkbox
                            checked={selectedContacts.some((c) => c.id === contact.id)}
                            onChange={() => {}}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                          </div>
                          {contact.group && (
                            <Badge variant="outline" className="text-xs">{contact.group}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedContacts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedContacts.map((contact) => (
                      <Badge key={contact.id} variant="secondary" className="flex items-center gap-1">
                        {contact.name}
                        <button
                          onClick={() => toggleContact(contact)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Channel Selection */}
            <Card className="card-ritual">
              <CardHeader>
                <CardTitle className="font-display text-xl">Delivery Channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={channel} onValueChange={(value: "sms" | "whatsapp" | "both") => setChannel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS (your SIM)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Device sends hand off to your phone's own apps; the cloud channel applies only to provider sends.
                </p>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="card-ritual">
              <CardHeader>
                <CardTitle className="font-display text-xl">Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="schedule-toggle" className="text-sm">Enable Scheduling</Label>
                  <Switch
                    id="schedule-toggle"
                    checked={enableScheduling}
                    onCheckedChange={setEnableScheduling}
                  />
                </div>

                {enableScheduling && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume an interrupted device blast */}
            {sendQueue.isActive && (
              <Card className="card-ritual border-primary/30 bg-gradient-aurora/5">
                <CardContent className="py-4 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-medium">Device blast in progress</span>
                    <span className="text-muted-foreground tabular">
                      {" "}— {sendQueue.remaining} of {sendQueue.queue?.items.length ?? 0} left
                    </span>
                  </div>
                  <Button size="sm" onClick={() => setQueueOpen(true)}>Resume</Button>
                </CardContent>
              </Card>
            )}

            {/* Send Card */}
            <Card className="card-ritual border-primary/20 bg-gradient-aurora/5">
              <CardContent className="pt-6 space-y-4">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Smartphone size={16} className="text-primary" />
                  Send with my phone — your SIM, your number
                </div>
                <p className="text-xs text-muted-foreground">
                  The primary path: each recipient opens in your own {channel === "whatsapp" ? "WhatsApp" : channel === "both" ? "SMS / WhatsApp" : "SMS"} app and you tap send yourself. No cloud gateway — just your phone, paced to stay spam-safe.
                </p>
                {enableScheduling ? (
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending}
                    className="w-full btn-ritual font-semibold"
                    size="lg"
                  >
                    <CalendarClock size={18} />
                    {isSending ? "Scheduling..." : "Schedule campaign"}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleDeviceSend}
                      disabled={isSending}
                      className="w-full btn-ritual font-semibold"
                      size="lg"
                    >
                      <Smartphone size={18} />
                      {isSending ? "Staging..." : "Send with my phone"}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Zap size={14} />
                      Send via cloud provider (optional)
                    </Button>
                  </>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {enableScheduling
                    ? "Scheduling runs through the cloud provider queue — device blasts send immediately."
                    : isMobileDevice()
                      ? `Anti-spam throttle: ${hourly.used}/${hourly.max} device opens this hour${hourly.remaining === 0 ? " — cap reached, wait for reset" : ""}.`
                      : "Open this page on your phone for sms:/WhatsApp hand-off — on desktop, use the copy fallback."}
                  {" "}Every send is logged in Message Logs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeviceSendQueue open={queueOpen} onOpenChange={setQueueOpen} />
    </Layout>
  );
};

export default SMSComposer;
