/**
 * API Settings — provider credential vault (AES-GCM encrypted server-side).
 * Secrets are write-only: the UI only ever sees masked values.
 */

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Key, BrainCircuit, MessageSquare, EyeOff, Eye, AlertCircle, Plug } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCredentials, useUpsertCredential, useTestCredential, useDeleteCredential } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";

const SMS_PROVIDERS = [
  { value: "sandbox", label: "Sandbox (simulated — no keys needed)" },
  { value: "twilio", label: "Twilio" },
  { value: "termii", label: "Termii" },
  { value: "infobip", label: "Infobip" },
  { value: "vonage", label: "Vonage" },
  { value: "custom", label: "Custom API" },
];

const AI_PROVIDERS = [
  { value: "sorcery", label: "Sorcery Engine (built-in — no key needed)" },
  { value: "openai", label: "OpenAI (GPT-4o, GPT-4o-mini)" },
  { value: "google", label: "Google Gemini" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "cohere", label: "Cohere" },
];

interface SmsForm {
  provider: string; apiKey: string; apiSecret: string; accountSid: string; authToken: string;
  senderId: string; baseUrl: string; endpoint: string; authHeader: string;
}
interface AiForm {
  provider: string; apiKey: string; model: string;
}

const ApiSettings = () => {
  const { data, isLoading } = useCredentials();
  const upsert = useUpsertCredential();
  const testCred = useTestCredential();
  const deleteCred = useDeleteCredential();

  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [sms, setSms] = useState<SmsForm>({
    provider: "sandbox", apiKey: "", apiSecret: "", accountSid: "", authToken: "",
    senderId: "", baseUrl: "", endpoint: "", authHeader: "",
  });
  const [ai, setAi] = useState<AiForm>({ provider: "sorcery", apiKey: "", model: "" });

  useEffect(() => {
    if (!data?.items) return;
    const smsCred = data.items.find((c) => c.kind === "sms");
    const aiCred = data.items.find((c) => c.kind === "ai");
    if (smsCred) {
      setSms((prev) => ({
        ...prev,
        provider: smsCred.provider,
        senderId: String(smsCred.meta.senderId ?? smsCred.meta.from ?? ""),
        baseUrl: String(smsCred.meta.baseUrl ?? ""),
        endpoint: String(smsCred.meta.endpoint ?? ""),
      }));
    }
    if (aiCred) {
      setAi((prev) => ({
        ...prev,
        provider: aiCred.provider,
        model: String(aiCred.meta.model ?? ""),
      }));
    }
  }, [data]);

  const saveSms = async () => {
    try {
      await upsert.mutateAsync({
        kind: "sms",
        provider: sms.provider,
        apiKey: sms.apiKey || undefined,
        apiSecret: sms.apiSecret || undefined,
        accountSid: sms.accountSid || undefined,
        authToken: sms.authToken || undefined,
        senderId: sms.senderId || undefined,
        baseUrl: sms.baseUrl || undefined,
        endpoint: sms.endpoint || undefined,
        authHeader: sms.authHeader || undefined,
      });
      setSms((p) => ({ ...p, apiKey: "", apiSecret: "", authToken: "", authHeader: "" }));
      toast.success("SMS provider saved (encrypted at rest)");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save SMS settings");
    }
  };

  const saveAi = async () => {
    try {
      await upsert.mutateAsync({
        kind: "ai",
        provider: ai.provider,
        apiKey: ai.apiKey || undefined,
        model: ai.model || undefined,
      });
      setAi((p) => ({ ...p, apiKey: "" }));
      toast.success("AI provider saved (encrypted at rest)");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save AI settings");
    }
  };

  const runTest = async (kind: "sms" | "ai") => {
    try {
      const result = await testCred.mutateAsync({ kind });
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Connection test failed");
    }
  };

  const isTwilio = sms.provider === "twilio";

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">API Settings</h1>
          <p className="text-muted-foreground">Connect your SMS and AI providers — keys are encrypted and never shown again</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Keys are encrypted with AES-256-GCM before storage and only ever sent to their provider.
            Leave a key blank to keep the current one. Out of the box, <strong>Sandbox</strong> + <strong>Sorcery</strong> work with zero configuration.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="skeleton h-96" /><div className="skeleton h-96" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* SMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" /> SMS Provider
                </CardTitle>
                <CardDescription>How Sorcery delivers text messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={sms.provider} onValueChange={(v) => setSms((p) => ({ ...p, provider: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SMS_PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {data?.items.find((c) => c.kind === "sms") && (
                    <p className="text-xs text-muted-foreground">
                      Stored key: <span className="tabular">{data.items.find((c) => c.kind === "sms")?.maskedKey}</span>
                    </p>
                  )}
                </div>

                {isTwilio && (
                  <>
                    <div className="space-y-2">
                      <Label>Account SID</Label>
                      <Input value={sms.accountSid} onChange={(e) => setSms((p) => ({ ...p, accountSid: e.target.value }))} placeholder="AC…" />
                    </div>
                    <div className="space-y-2">
                      <Label>Auth Token</Label>
                      <Input type="password" value={sms.authToken} onChange={(e) => setSms((p) => ({ ...p, authToken: e.target.value }))} placeholder="••••••••" />
                    </div>
                  </>
                )}

                {["termii", "infobip"].includes(sms.provider) && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input type={showSmsKey ? "text" : "password"} value={sms.apiKey} onChange={(e) => setSms((p) => ({ ...p, apiKey: e.target.value }))} placeholder="••••••••" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowSmsKey(!showSmsKey)} aria-label={showSmsKey ? "Hide key" : "Show key"}>
                        {showSmsKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {sms.provider === "vonage" && (
                  <>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input type={showSmsKey ? "text" : "password"} value={sms.apiKey} onChange={(e) => setSms((p) => ({ ...p, apiKey: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>API Secret</Label>
                      <Input type="password" value={sms.apiSecret} onChange={(e) => setSms((p) => ({ ...p, apiSecret: e.target.value }))} />
                    </div>
                  </>
                )}

                {sms.provider === "infobip" && (
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input value={sms.baseUrl} onChange={(e) => setSms((p) => ({ ...p, baseUrl: e.target.value }))} placeholder="https://api.infobip.com" />
                  </div>
                )}

                {sms.provider === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label>Endpoint URL (https)</Label>
                      <Input value={sms.endpoint} onChange={(e) => setSms((p) => ({ ...p, endpoint: e.target.value }))} placeholder="https://api.example.com/send" />
                    </div>
                    <div className="space-y-2">
                      <Label>Authorization header (optional)</Label>
                      <Input type="password" value={sms.authHeader} onChange={(e) => setSms((p) => ({ ...p, authHeader: e.target.value }))} placeholder="Bearer …" />
                    </div>
                  </>
                )}

                {!["sandbox", "custom"].includes(sms.provider) && (
                  <div className="space-y-2">
                    <Label>Sender ID / From Number</Label>
                    <Input value={sms.senderId} onChange={(e) => setSms((p) => ({ ...p, senderId: e.target.value }))} placeholder="+15551234567 or SORCERY" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={saveSms} disabled={upsert.isPending}>
                    {upsert.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => runTest("sms")} disabled={testCred.isPending}>
                    {testCred.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plug size={14} className="mr-1.5" />}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  <BrainCircuit className="mr-2 h-5 w-5 text-primary" /> AI Provider
                </CardTitle>
                <CardDescription>How Sorcery writes your messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={ai.provider} onValueChange={(v) => setAi((p) => ({ ...p, provider: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {data?.items.find((c) => c.kind === "ai") && (
                    <p className="text-xs text-muted-foreground">
                      Stored key: <span className="tabular">{data.items.find((c) => c.kind === "ai")?.maskedKey}</span>
                    </p>
                  )}
                </div>

                {ai.provider !== "sorcery" && (
                  <>
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        API Key
                        <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setShowAiKey(!showAiKey)}>
                          {showAiKey ? <span className="flex items-center"><EyeOff className="mr-1 h-3 w-3" />Hide</span> : <span className="flex items-center"><Eye className="mr-1 h-3 w-3" />Show</span>}
                        </button>
                      </Label>
                      <div className="relative">
                        <Input type={showAiKey ? "text" : "password"} value={ai.apiKey} onChange={(e) => setAi((p) => ({ ...p, apiKey: e.target.value }))} placeholder="••••••••" className="pr-10" />
                        <Key className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Model (optional)</Label>
                      <Input value={ai.model} onChange={(e) => setAi((p) => ({ ...p, model: e.target.value }))} placeholder="gpt-4o-mini · claude-3-5-haiku-latest · gemini-1.5-flash" />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button onClick={saveAi} disabled={upsert.isPending}>
                    {upsert.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => runTest("ai")} disabled={testCred.isPending}>
                    {testCred.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plug size={14} className="mr-1.5" />}
                    Test Connection
                  </Button>
                  {(data?.items ?? []).some((c) => c.kind === "ai") && (
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        const cred = data!.items.find((c) => c.kind === "ai")!;
                        await deleteCred.mutateAsync(cred.id);
                        setAi({ provider: "sorcery", apiKey: "", model: "" });
                        toast.success("AI key removed — Sorcery engine active");
                      }}
                    >
                      Remove key
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApiSettings;
