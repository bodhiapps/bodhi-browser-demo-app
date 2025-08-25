import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformStatusSection } from "@/components/platform/PlatformStatusSection";
import { AuthenticationStatusSection } from "@/components/auth/AuthenticationStatusSection";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import { useAuthentication } from "@/hooks/useAuthentication";

export default function HomePage() {
  const platformState = usePlatformDetection();
  const authState = useAuthentication(platformState);

  const handleRetryPlatformDetection = () => {
    window.location.reload(); // Simple retry - could be enhanced
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl">
              Bodhi Browser Demo App
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Demonstrating Bodhi browser extension integration with OAuth 2.1 authentication
            </p>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <PlatformStatusSection 
          platformState={platformState} 
          onRetry={handleRetryPlatformDetection}
        />

        {/* Authentication Status - Only show when extension is detected */}
        {platformState.status === 'detected' && (
          <AuthenticationStatusSection authState={authState} />
        )}

        {/* Additional Features Section - Only show when authenticated */}
        {authState.status === 'authenticated' && (
          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Authentication successful! You can now access Bodhi platform features.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}