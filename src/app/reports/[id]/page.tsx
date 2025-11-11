import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import type {
  InspectionReport,
  InspectionCategory,
  InspectionItemWithStatus,
} from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ArrowLeft,
  XCircle,
  Wrench,
  CheckCircle,
  Settings,
  Printer,
  Gauge,
  Car,
} from 'lucide-react';
import Link from 'next/link';
import { getReportDetails } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { iconMap } from '@/lib/definitions';
import AppHeader from '@/components/app-header';
import PrintButton from '@/components/ui/print-button';
import { redirect } from 'next/navigation';

const statusMap = {
  Ok: { icon: CheckCircle, color: 'text-green-500', label: 'Ok' },
  'Needs Repair': {
    icon: Wrench,
    color: 'text-amber-500',
    label: 'Needs Repair',
  },
  'not ok': { icon: XCircle, color: 'text-destructive', label: 'Not OK' },
};

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reportId = params.id;
  const { userId, orgId, orgRole } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  if (!orgId) {
    redirect('/');
  }

  const isSuperAdmin = user.publicMetadata?.role === 'super_admin';
  const isOrgAdmin = orgRole === 'org:admin';

  if (!isSuperAdmin && !isOrgAdmin) {
    redirect('/');
  }

  const reportResult = await getReportDetails(reportId);

  if (!reportResult.success || !reportResult.data) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <AppHeader />
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Report Not Found</CardTitle>
            <CardDescription>{reportResult.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/reports">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = reportResult.data;

  const groupedItems = React.useMemo(() => {
    if (!report?.items) return [];

    const categoriesMap: Record<
      string,
      Omit<InspectionCategory, 'items' | 'icon'> & {
        items: InspectionItemWithStatus[];
      }
    > = {};

    for (const item of report.items) {
      if (!categoriesMap[item.categoryId]) {
        categoriesMap[item.categoryId] = {
          id: item.categoryId,
          name: item.categoryName,
          items: [],
        };
      }
      categoriesMap[item.categoryId].items.push(item);
    }

    return Object.values(categoriesMap);
  }, [report]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8 printable-container">
          <Card className="printable-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      report.finalVerdict === 'PASS' ? 'default' : 'destructive'
                    }
                    className="text-lg py-2 px-6"
                  >
                    {report.finalVerdict}
                  </Badge>
                  <PrintButton />
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="printable-card">
            <CardHeader>
              <CardTitle>Checklist Details</CardTitle>
              <CardDescription>
                A complete breakdown of the inspection checklist items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupedItems?.map((category) => {
                  const IconComponent =
                    iconMap[
                      category.name.replace(/\s+/g, '') as keyof typeof iconMap
                    ] || Settings;
                  return (
                    <div key={category.id}>
                      <h3 className="flex items-center text-lg font-semibold mb-3">
                        <IconComponent className="h-5 w-5 mr-3 text-primary" />
                        {category.name}
                      </h3>
                      <div className="divide-y rounded-md border">
                        {category.items.map((item) => {
                          const statusInfo = statusMap[item.status];
                          if (!statusInfo) return null; // Graceful fallback
                          const StatusIcon = statusInfo.icon;
                          const statusColor = statusInfo.color;
                          const statusLabel = statusInfo.label;

                          return (
                            <div
                              key={item.id}
                              className="p-4 grid md:grid-cols-2 gap-4"
                            >
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Notes:</strong> {item.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-start md:justify-end">
                                <Badge
                                  variant="outline"
                                  className={`text-sm ${statusColor} border-current`}
                                >
                                  <StatusIcon className={`h-4 w-4 mr-2`} />
                                  {statusLabel}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
