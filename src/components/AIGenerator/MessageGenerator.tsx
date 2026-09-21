/**
 * MessageGenerator — live AI generation via the configured provider
 * (Sorcery engine by default; OpenAI/Anthropic/Gemini/Cohere when keyed).
 */

import { useState } from "react";
import { Button } from "@/components/ui-custom/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BrainCircuit, Copy, Loader2, RefreshCcw, Save, Send, Sparkles, Wand2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCreateTemplate } from "@/hooks/useApi";
import type { AiGenerationResult } from "@/lib/types";

const MESSAGE_TYPES = [
  { value: "marketing", label: "Marketing & Promotions" },
  { value: "reminder", label: "Reminders & Follow-ups" },
  { value: "notification", label: "Notifications & Updates" },
  { value: "alert", label: "Alerts & Urgent" },
  { value: "other", label: "General / Other" },
];

const MessageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [messageType, setMessageType] = useState("marketing");
  const [maxLength, setMaxLength] = useState(320);
  const [tone, setTone] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<AiGenerationResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const createTemplate = useCreateTemplate();

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe the message you want to create");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await api.generate({
        prompt,
        kind: messageType,
        maxLength,
        variants: 3,
        tone: tone || undefined,
      });
      setResults(result);
      setSelectedIndex(0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const selected = results?.texts[selectedIndex] ?? "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(selected);
    toast.success("Message copied to clipboard");
  };

  const useInComposer = () => {
    navigate("/sms-composer", { state: { prefill: selected } });
  };

  const saveAsTemplate = async () => {
    if (!selected) return;
    try {
      await createTemplate.mutateAsync({
        title: prompt.slice(0, 60) || "AI Message",
        content: selected,
        category: messageType,
        model: results?.model,
      });
      toast.success("Saved to templates");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  };

  return (
    <Card className="card-aurora">
      <CardHeader>
        <CardTitle className="flex items-center font-display text-xl">
          <Wand2 size={18} className="mr-2 text-primary" /> Describe your message
        </CardTitle>
        <CardDescription>
          The AI writes ready-to-send copy — just tell it what you want to say
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="prompt">What should the message say?</Label>
          <Textarea
            id="prompt"
            placeholder="e.g. Promotional message for a 30% off flash sale this weekend, friendly and urgent…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[110px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tone (optional)</Label>
            <Select value={tone || "auto"} onValueChange={(v) => setTone(v === "auto" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max length: <span className="tabular">{maxLength}</span> chars</Label>
            <Slider value={[maxLength]} onChange={(v) => setMaxLength(v[0])} min={80} max={640} step={20} className="pt-2" />
          </div>
        </div>

        <Button onClick={generate} disabled={isGenerating || !prompt.trim()} className="w-full sm:w-auto shadow-glow" size="lg">
          {isGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
          Generate Messages
        </Button>

        {results && (
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1"><BrainCircuit size={11} />{results.model}</Badge>
                <span className="text-xs text-muted-foreground tabular">
                  {selected.length} chars · {results.segments[selectedIndex]?.segments ?? 1} segment(s) · {results.segments[selectedIndex]?.encoding}
                </span>
              </div>
              {results.texts.length > 1 && (
                <div className="flex gap-1">
                  {results.texts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`h-7 w-7 rounded-full text-xs font-medium transition-colors ${
                        i === selectedIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                      aria-label={`Variant ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-5 text-base leading-relaxed shadow-subtle min-h-[110px] whitespace-pre-wrap">
              {selected}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={useInComposer}><Send size={14} className="mr-1.5" /> Use in Composer</Button>
              <Button variant="outline" onClick={copyToClipboard}><Copy size={14} className="mr-1.5" /> Copy</Button>
              <Button variant="outline" onClick={saveAsTemplate} disabled={createTemplate.isPending}>
                <Save size={14} className="mr-1.5" /> Save as Template
              </Button>
              <Button variant="ghost" onClick={generate} disabled={isGenerating}>
                <RefreshCcw size={14} className="mr-1.5" /> Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageGenerator;
