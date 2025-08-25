import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { oauthManager } from '@/lib/oauth';

type ProcessingState =
  | { status: 'loading' }
  | { status: 'processing'; step: string }
  | { status: 'success' }
  | { status: 'error'; message: string };

export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ProcessingState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    const processCallback = async () => {
      try {
        setState({ status: 'processing', step: 'Processing OAuth callback...' });
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          const errorMessage = errorDescription || error;
          setState({
            status: 'error',
            message: errorMessage === 'access_denied'
              ? 'User denied access to the application'
              : `OAuth error: ${errorMessage}`,
          });
          return;
        }

        if (!code) {
          setState({ status: 'error', message: 'Authorization code not found' });
          return;
        }

        if (!state) {
          setState({ status: 'error', message: 'State parameter not found' });
          return;
        }

        setState({ status: 'processing', step: 'Exchanging authorization code for token...' });
        await oauthManager.exchangeCodeForTokens(code, state);
        
        if (!mounted) return;

        setState({ status: 'success' });
        setTimeout(() => {
          if (mounted) navigate('/');
        }, 2000);
      } catch (error) {
        if (!mounted) return;
        console.error('OAuth callback processing failed:', error);
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    processCallback();
    return () => { mounted = false; };
  }, [searchParams, navigate]);

  const handleReturnHome = () => navigate('/');
  const handleRetry = () => window.location.reload();

  if (state.status === 'loading') {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Callback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Initializing...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === 'processing') {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Callback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {state.step}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === 'success') {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Authentication Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You have been successfully authenticated. Redirecting to home page...</p>
            <Button onClick={handleReturnHome} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Authentication Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline">
                Retry
              </Button>
              <Button onClick={handleReturnHome}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}