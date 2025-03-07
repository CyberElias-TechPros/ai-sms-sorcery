
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Check, Copy, BrainCircuit } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AIMessageCardProps {
  title: string;
  content: string;
  model: string;
  timestamp: string;
  className?: string;
  onUse?: () => void;
}

const AIMessageCard = ({
  title,
  content,
  model,
  timestamp,
  className,
  onUse
}: AIMessageCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      variant="border" 
      className={cn("overflow-hidden", className)}
      hover
    >
      <CardHeader className="pb-2 flex flex-col space-y-1 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <Badge variant="ghost" size="sm" className="flex items-center gap-1">
            <BrainCircuit size={12} />
            <span>{model}</span>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {content}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border/40 py-3 px-4">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs h-7"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} className="mr-1 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} className="mr-1" />
              Copy
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs h-7"
          onClick={onUse}
        >
          Use
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIMessageCard;
