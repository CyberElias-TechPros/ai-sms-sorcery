
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Badge = ({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-medium",
        "transition-all duration-200 ease-in-out",
        size === "sm" && "text-xs px-2 py-0.5 rounded-full",
        size === "md" && "text-xs px-2.5 py-0.5 rounded-full",
        size === "lg" && "text-sm px-3 py-1 rounded-full",
        variant === "default" && "bg-primary/10 text-primary",
        variant === "success" && "bg-success/10 text-success",
        variant === "warning" && "bg-warning/10 text-warning",
        variant === "error" && "bg-destructive/10 text-destructive",
        variant === "outline" && "bg-transparent border border-border text-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "ghost" && "bg-secondary/50 text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
};

export { Badge };
