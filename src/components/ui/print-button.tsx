'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className="print-hidden"
    >
      <Printer className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
}
