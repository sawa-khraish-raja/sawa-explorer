import React from 'react';
import { base44 } from '@/api/base44Client';

export const handleError = async (error, context = {}) => {
  const errorData = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    context: JSON.stringify(context),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  try {
    await base44.entities.ErrorLog.create({
      section: context.section || 'Unknown',
      message: errorData.message,
      user_email: context.userEmail || 'anonymous',
      details: JSON.stringify(errorData),
    });
  } catch (logError) {
    // Silent fail for error logging
  }

  return errorData;
};

export const withErrorBoundary = (Component) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      handleError(error, {
        section: 'ErrorBoundary',
        component: Component.name,
        errorInfo: errorInfo.componentStack,
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className='flex flex-col items-center justify-center min-h-screen p-4'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>Something went wrong</h2>
              <p className='text-gray-600 mb-4'>
                We're sorry for the inconvenience. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className='bg-[#9933CC] hover:bg-[#7B2CBF] text-white px-6 py-3 rounded-lg font-semibold'
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

export const logError = async (section, message, details = {}) => {
  try {
    await base44.entities.ErrorLog.create({
      section,
      message,
      details: JSON.stringify(details),
    });
  } catch (e) {
    // Silent fail
  }
};

export const handleAPIError = (error, fallbackMessage = 'An error occurred') => {
  if (error.response) {
    return error.response.data?.message || fallbackMessage;
  }

  if (error.request) {
    return 'Network error. Please check your connection.';
  }

  return error.message || fallbackMessage;
};

export const isNetworkError = (error) => {
  return error.message === 'Network Error' || error.message.includes('network') || !error.response;
};

export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};
