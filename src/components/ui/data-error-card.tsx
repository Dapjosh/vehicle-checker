'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DataErrorCard({ error }: { error?: string }) {
  return (
    <div className="flex justify-center items-center p-8">
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle className="flex justify-center items-center gap-2 text-destructive">
            <AlertTriangle />
            Failed to Load Inspection Data
          </CardTitle>
          <CardDescription>
            {error || 'An unknown error occurred.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* This onClick will now work */}
          <Button onClick={() => window.location.reload()}>
            <RotateCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}