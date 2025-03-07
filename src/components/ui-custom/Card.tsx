
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated" | "border";
  hover?: boolean;
}

const Card = ({ 
  className, 
  variant = "default", 
  hover = false,
  ...props 
}: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "transition-all duration-200 ease-in-out",
        variant === "default" && "bg-card",
        variant === "glass" && "glass",
        variant === "elevated" && "bg-card shadow-elevated",
        variant === "border" && "bg-card border",
        hover && "hover:shadow-elevated hover:translate-y-[-1px]",
        className
      )}
      {...props}
    />
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={cn("p-6 flex flex-col space-y-1.5", className)}
      {...props}
    />
  );
};

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return (
    <h3
      className={cn(
        "text-lg font-medium leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
};

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = ({ className, ...props }: CardDescriptionProps) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = ({ className, ...props }: CardContentProps) => {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = ({ className, ...props }: CardFooterProps) => {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
