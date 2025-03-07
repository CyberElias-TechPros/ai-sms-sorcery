
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive?: boolean;
  };
  loading?: boolean;
  className?: string;
}

const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  loading = false,
  className,
}: StatsCardProps) => {
  return (
    <Card 
      variant="border" 
      className={cn("overflow-hidden animate-scale-in", className)}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 bg-muted/60 rounded-md animate-pulse" />
            {description && <div className="h-4 w-24 bg-muted/60 rounded-md animate-pulse" />}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center mt-1">
              {trend && (
                <Badge
                  variant={trend.positive ? "success" : "error"}
                  size="sm"
                  className="mr-2"
                >
                  {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
                </Badge>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
