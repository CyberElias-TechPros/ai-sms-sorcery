
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "subtle" | "ghost" | "link" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant = "default",
    size = "md",
    loading = false,
    icon,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "transition-all duration-200 ease-in-out select-none",
          
          // Base styles
          "rounded-lg active:scale-[0.98]",
          
          // Variants
          variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === "outline" && "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
          variant === "subtle" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
          variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          
          // Sizes
          size === "sm" && "text-xs h-8 px-3 py-1",
          size === "md" && "text-sm h-9 px-4 py-2",
          size === "lg" && "text-sm h-10 px-5 py-2",
          size === "icon" && "h-9 w-9 p-0",
          
          // States
          (loading || props.disabled) && "opacity-70 cursor-not-allowed active:scale-100",
          
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            {children}
          </div>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
