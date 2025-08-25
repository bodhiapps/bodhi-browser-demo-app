import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import type { PlatformDetectionState } from "@/hooks/usePlatformDetection";

interface PlatformStatusSectionProps {
  platformState: PlatformDetectionState;
  onRetry: () => void;
}

export function PlatformStatusSection({ platformState, onRetry }: PlatformStatusSectionProps) {
  const getStatusDisplay = () => {
    switch (platformState.status) {
      case 'detecting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Detecting',
          variant: 'secondary' as const,
          description: 'Searching for Bodhi browser extension...',
        };
      case 'detected':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Detected',
          variant: 'default' as const,
          description: `Extension found with ID: ${platformState.extensionId}`,
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Error',
          variant: 'destructive' as const,
          description: platformState.error || 'Unknown error occurred',
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Unknown',
          variant: 'secondary' as const,
          description: 'Unknown status',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Extension Status
          <Badge variant={statusDisplay.variant} className="flex items-center gap-1">
            {statusDisplay.icon}
            {statusDisplay.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {statusDisplay.description}
        </p>
        
        {platformState.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure the Bodhi browser extension is installed and enabled.
            </AlertDescription>
          </Alert>
        )}

        {platformState.status !== 'detecting' && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Detection
          </Button>
        )}
      </CardContent>
    </Card>
  );
}