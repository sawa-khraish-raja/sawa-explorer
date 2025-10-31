import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ErrorBoundary]', error, errorInfo);
    
    // Log to backend
    try {
      if (typeof window !== 'undefined' && window.base44) {
        window.base44.entities.ErrorLog.create({
          section: 'ErrorBoundary',
          message: error.message,
          details: JSON.stringify({
            stack: error.stack,
            componentStack: errorInfo.componentStack
          })
        }).catch(() => {});
      }
    } catch (e) {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = createPageUrl('Home');
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('127.0.0.1') ||
                           window.location.hostname.includes('base44.app');
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6 text-sm">
              Don't worry, we're on it! Try refreshing the page or go back home.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-[#9933CC] to-[#330066] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {isDevelopment && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Error Details
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;