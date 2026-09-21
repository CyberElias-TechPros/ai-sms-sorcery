/**
 * DeviceSendQueue — the bulk local-send stepper.
 *
 * Walks the queue recipient by recipient: opens the phone's own SMS composer
 * (sms: URI) or WhatsApp, waits for the user's on-device confirmation, records
 * the outcome, advances. Resume-safe; anti-spam pacing built in.
 */

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Check, ChevronRight, Copy, MessageSquare, Phone, SkipForward, Smartphone, X,
} from "lucide-react";
import { useSendQueue } from "@/hooks/useSendQueue";
import { isMobileDevice } from "@/lib/smsUri";
import { api, ApiError } from "@/lib/api";
import type { MessageStatus } from "@/lib/types";

interface DeviceSendQueueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const statusLabel: Record<string, string> = {
  sent: "Sent",
  skipped: "Skipped",
  failed: "Failed",
  opened: "Opened",
  pending: "Pending",
};

const DeviceSendQueue = ({ open, onOpenChange, onComplete }: DeviceSendQueueProps) => {
  const {
    queue, current, done, remaining,
    openCurrent, confirmSent, skip, markFailed, reset, pace, setPace,
    isActive,
  } = useSendQueue();
  const [busy, setBusy] = useState(false);

  const total = queue?.items.length ?? 0;
  const completed = done.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  // Mirror on-device outcomes into the message log (honest states).
  const recordStatus = async (messageId: string, status: Extract<MessageStatus, "sent" | "delivered" | "failed" | "cancelled">) => {
    try {
      await api.markMessage(messageId, status);
    } catch (err) {
      // Non-fatal: local queue remains the source of truth for the run.
      console.warn("status mirror failed:", err instanceof ApiError ? err.message : err);
    }
  };

  const handleConfirm = async () => {
    if (!current) return;
    setBusy(true);
    confirmSent();
    await recordStatus(current.messageId, "sent");
    setBusy(false);
  };

  const handleSkip = async () => {
    if (!current) return;
    skip();
    await recordStatus(current.messageId, "cancelled");
  };

  const handleFailed = async () => {
    if (!current) return;
    markFailed();
    await recordStatus(current.messageId, "failed");
  };

  // When the run completes, surface the summary once.
  useEffect(() => {
    if (queue && total > 0 && remaining === 0 && open) {
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, total]);

  const finished = !!queue && total > 0 && remaining === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Smartphone size={20} className="text-primary" /> Send with my phone
          </DialogTitle>
          <DialogDescription>
            Each message opens in your phone's own {current?.channel === "whatsapp" ? "WhatsApp" : "SMS"} app —
            <strong> your SIM, your number, your network</strong>. Tap send on your phone, then confirm here.
          </DialogDescription>
        </DialogHeader>

        {!queue ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No active queue — pick recipients and choose “Send with my phone”.
          </div>
        ) : finished ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
              <Check size={26} className="text-success" />
            </div>
            <h3 className="font-display text-xl">Queue complete</h3>
            <p className="text-sm text-muted-foreground tabular">
              {done.filter((d) => d.status === "sent").length} sent ·{" "}
              {done.filter((d) => d.status === "skipped").length} skipped ·{" "}
              {done.filter((d) => d.status === "failed").length} failed
            </p>
            <Button onClick={() => { reset(); onOpenChange(false); onComplete?.(); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground tabular">
                <span>{completed} of {total} complete</span>
                <span>{remaining} remaining</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* current recipient */}
            {current && (
              <div className="rounded-xl border bg-card p-5 spotlight">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-lg truncate">{current.name}</p>
                    <p className="text-sm text-muted-foreground tabular flex items-center gap-1.5">
                      <Phone size={13} /> {current.phone}
                      <Badge variant="outline" size="sm" className="ml-1">
                        {current.channel === "whatsapp" ? <MessageSquare size={10} className="mr-1" /> : <Smartphone size={10} className="mr-1" />}
                        {current.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                      </Badge>
                    </p>
                  </div>
                  <Badge variant="outline" size="sm" className="shrink-0 tabular">{currentIndexLabel(queue, current.messageId)}</Badge>
                </div>

                <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {queue.body}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="lg" className="shadow-glow col-span-2" onClick={openCurrent}>
                    <Smartphone size={16} className="mr-2" />
                    Open {current.channel === "whatsapp" ? "WhatsApp" : "SMS app"}
                  </Button>
                  <Button variant="outline" onClick={handleConfirm} disabled={busy}>
                    <Check size={15} className="mr-1.5 text-success" /> I sent it — next
                  </Button>
                  <Button variant="ghost" onClick={() => navigator.clipboard.writeText(queue.body).then(() => toast.success("Message copied"))}>
                    <Copy size={15} className="mr-1.5" /> Copy text
                  </Button>
                </div>

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={handleSkip}>
                      <SkipForward size={14} className="mr-1" /> Skip
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={handleFailed}>
                      <X size={14} className="mr-1" /> Failed
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="pace" checked={pace} onCheckedChange={setPace} />
                    <Label htmlFor="pace" className="text-xs text-muted-foreground">Anti-spam pacing</Label>
                  </div>
                </div>

                {!isMobileDevice() && (
                  <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                    Desktop note: the sms:/WhatsApp link may open a linked phone app (Phone Link, macOS Messages,
                    WhatsApp Desktop). If nothing opens, use <strong>Copy text</strong> and send from your phone manually.
                  </p>
                )}
              </div>
            )}

            {/* progress list */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {queue.items.map((item, i) => (
                <div
                  key={item.messageId}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                    item.messageId === current?.messageId ? "border-primary/40 bg-primary/5" : "border-transparent bg-muted/40"
                  }`}
                >
                  <span className="truncate">
                    <span className="tabular text-muted-foreground mr-2">{i + 1}.</span>
                    {item.name}
                  </span>
                  <Badge
                    variant="outline"
                    size="sm"
                    className={
                      item.status === "sent" ? "text-success bg-success/10"
                        : item.status === "failed" ? "text-destructive bg-destructive/10"
                        : item.status === "skipped" ? "text-muted-foreground"
                        : item.status === "opened" ? "text-warning bg-warning/10"
                        : "text-muted-foreground"
                    }
                  >
                    {statusLabel[item.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function currentIndexLabel(queue: { items: Array<{ messageId: string; status: string }> }, messageId: string): string {
  const idx = queue.items.findIndex((i) => i.messageId === messageId);
  return `${idx + 1} / ${queue.items.length}`;
}

export default DeviceSendQueue;
