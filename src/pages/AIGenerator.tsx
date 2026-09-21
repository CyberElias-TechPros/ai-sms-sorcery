/**
 * AI Message Generator — single + bulk personalized generation, live history.
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import MessageGenerator from "@/components/AIGenerator/MessageGenerator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import {
  BrainCircuit, ArrowLeft, Lightbulb, HelpCircle, MessageSquare, History,
  Loader2, Send, Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ContactsSearch, { Contact } from "@/components/Contacts/ContactsSearch";
import { useAiHistory, useSendMessages } from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import type { AiBulkItem } from "@/lib/types";
import { toast } from "sonner";

const suggestionPrompts = [
  "Create a promotional message for a 30% off flash sale",
  "Write a gentle reminder for an upcoming appointment",
  "Draft a shipping notification for an e-commerce order",
  "Compose a follow-up message after a customer purchase",
  "Generate a welcome message for new subscribers",
];

const AIGenerator = () => {
  const [bulkPrompt, setBulkPrompt] = useState("");
  const [bulkKind, setBulkKind] = useState("marketing");
  const [bulkContacts, setBulkContacts] = useState<Contact[]>([]);
  const [bulkItems, setBulkItems] = useState<AiBulkItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data: historyData } = useAiHistory();
  const sendMessages = useSendMessages();
  const navigate = useNavigate();

  const runBulk = async () => {
    if (!bulkPrompt.trim()) { toast.error("Describe the message first"); return; }
    if (bulkContacts.length === 0) { toast.error("Pick at least one recipient"); return; }
    setBulkLoading(true);
    try {
      const result = await api.generateBulk({
        prompt: bulkPrompt,
        kind: bulkKind,
        maxLength: 320,
        recipients: bulkContacts.map((c) => ({ contactId: c.id, phoneNumber: c.phoneNumber, name: c.name })),
      });
      setBulkItems(result.items);
      toast.success(`Generated ${result.items.length} personalized messages`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Bulk generation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const sendBulk = async () => {
    if (bulkItems.length === 0) return;
    try {
      // Personalized sends: one message per recipient with their variant.
      for (const item of bulkItems) {
        await sendMessages.mutateAsync({
          body: item.text,
          recipients: [item.recipient],
          channel: "sms",
          aiGenerated: true,
          idempotencyKey: crypto.randomUUID(),
        });
      }
      toast.success(`Sent ${bulkItems.length} personalized messages`);
      navigate("/message-logs");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Send failed");
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
              <Badge variant="outline" size="sm"><BrainCircuit size={12} className="mr-1" />AI Tool</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">AI Message Generator</h1>
            <p className="text-muted-foreground">Divine copy, in seconds — for SMS and WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History size={14} className="mr-1" /> Message History
            </Button>
          </div>
        </div>

        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generator">Single Message</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="pt-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3"><MessageGenerator /></div>

              <div className="space-y-6">
                <Card variant="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Lightbulb size={16} className="mr-2 text-warning" /> Suggestions
                    </CardTitle>
                    <CardDescription>Try these prompts</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2">
                      {suggestionPrompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => { navigator.clipboard.writeText(p); toast.success("Prompt copied — paste it in the composer"); }}
                          className="w-full p-2 text-xs text-left bg-secondary/50 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card variant="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <MessageSquare size={16} className="mr-2 text-success" /> WhatsApp Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Country codes: </span>always include one (e.g. +1 for US).</p>
                    <p><span className="font-medium text-foreground">Manual confirmation: </span>WhatsApp opens per recipient — you confirm each send.</p>
                    <p><span className="font-medium text-foreground">Personalize: </span>personalized messages perform better and reduce spam flags.</p>
                  </CardContent>
                </Card>

                <Card variant="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <HelpCircle size={16} className="mr-2 text-primary" /> General Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Be specific: </span>include audience, tone and purpose.</p>
                    <p><span className="font-medium text-foreground">Keep it brief: </span>under 160 characters = one SMS segment.</p>
                    <p><span className="font-medium text-foreground">Include a CTA: </span>clear call-to-action drives engagement.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="pt-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 card-aurora">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center"><Users size={18} className="mr-2 text-primary" /> Bulk Personalization</CardTitle>
                  <CardDescription>One brief → a personalized message for every recipient</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message brief</Label>
                    <Textarea
                      placeholder="e.g. Reminder about tomorrow's appointment at 3pm"
                      value={bulkPrompt}
                      onChange={(e) => setBulkPrompt(e.target.value)}
                      className="min-h-[90px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={bulkKind} onValueChange={setBulkKind}>
                      <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <ContactsSearch onSelectContacts={setBulkContacts} selectedContacts={bulkContacts} maxHeight="220px" />
                  </div>
                  <Button onClick={runBulk} disabled={bulkLoading} className="shadow-glow">
                    {bulkLoading ? <Loader2 size={15} className="mr-2 animate-spin" /> : <BrainCircuit size={15} className="mr-2" />}
                    Generate for {bulkContacts.length || 0} recipient{bulkContacts.length !== 1 ? "s" : ""}
                  </Button>
                </CardContent>
              </Card>

              <Card variant="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Preview</CardTitle>
                  <CardDescription>Each message uses the recipient's name</CardDescription>
                </CardHeader>
                <CardContent>
                  {bulkItems.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Generated messages will appear here
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {bulkItems.map((item, i) => (
                        <div key={i} className="rounded-lg border bg-card p-3 text-sm">
                          <p className="font-medium text-xs text-muted-foreground mb-1 tabular">
                            {item.recipient.name || item.recipient.phoneNumber}
                          </p>
                          <p className="whitespace-pre-wrap">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                {bulkItems.length > 0 && (
                  <div className="p-4 pt-0">
                    <Button className="w-full" onClick={sendBulk} disabled={sendMessages.isPending}>
                      {sendMessages.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />}
                      Send all ({bulkItems.length})
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generation history</DialogTitle>
            <DialogDescription>Your recent AI-generated messages</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(historyData?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No generations yet</p>
            ) : (
              (historyData?.items ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.kind} · {item.model || item.provider} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{item.content}</p>
                  <Button size="sm" variant="ghost" className="mt-1 h-7" onClick={() => { navigator.clipboard.writeText(item.content); toast.success("Copied"); }}>
                    Copy
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AIGenerator;
