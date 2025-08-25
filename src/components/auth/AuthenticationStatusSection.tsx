import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, LogIn, LogOut, Loader2, AlertCircle } from "lucide-react";
import type { AuthenticationState } from "@/types/auth";

interface AuthenticationStatusSectionProps {
  authState: AuthenticationState;
}

export function AuthenticationStatusSection({ authState }: AuthenticationStatusSectionProps) {
  const getStatusDisplay = () => {
    switch (authState.status) {
      case 'unauthenticated':
        return {
          icon: <LogIn className="h-4 w-4" />,
          label: 'Not Authenticated',
          variant: 'secondary' as const,
        };
      case 'authenticating':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Authenticating',
          variant: 'default' as const,
        };
      case 'authenticated':
        return {
          icon: <User className="h-4 w-4" />,
          label: 'Authenticated',
          variant: 'default' as const,
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Error',
          variant: 'destructive' as const,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Authentication Status
          <Badge variant={statusDisplay.variant} className="flex items-center gap-1">
            {statusDisplay.icon}
            {statusDisplay.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {authState.userInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>Email:</strong> {authState.userInfo.email}
            </div>
            <div className="flex items-center gap-2">
              <strong>Role:</strong> {authState.userInfo.role}
            </div>
          </div>
        )}

        {authState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authState.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {authState.status === 'unauthenticated' || authState.status === 'error' ? (
            <Button onClick={authState.login} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Log In
            </Button>
          ) : authState.status === 'authenticated' ? (
            <Button
              onClick={authState.logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          ) : null}
        </div>

        {authState.status === 'unauthenticated' && (
          <p className="text-sm text-muted-foreground">
            Click "Log In" to start the OAuth authentication flow with the Bodhi platform.
          </p>
        )}
      </CardContent>
    </Card>
  );
}