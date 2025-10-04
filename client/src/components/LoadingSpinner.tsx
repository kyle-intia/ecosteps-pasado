// client/src/components/LoadingSpinner.tsx
// Reusable loading component for consistent UI

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  fullPage = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinnerElement = (
    <div className="flex items-center justify-center space-x-3">
      <div
        className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}
      ></div>
      <div className="text-muted-foreground">
        {message}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="shadow-card border-border">
          <CardContent className="p-8">
            {spinnerElement}
          </CardContent>
        </Card>
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;