'use client';
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { InspectionReportSummary } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  ChevronsUpDown,
  Check,
  X,
  Download,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getAllReportsForExport, getChecklistAction } from '@/app/actions';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

const verdicts = [
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
];

export default function ReportsPageClient({
  initialReports,
}: {
  initialReports: InspectionReportSummary[];
}) {
  const [reports, setReports] =
    useState<InspectionReportSummary[]>(initialReports);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [isExporting, startExportTransition] = useTransition();

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        report.vehicleRegistration.toLowerCase().includes(searchLower) ||
        report.driverName.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter
        ? report.finalVerdict === statusFilter
        : true;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, statusFilter]);

  const handleExport = () => {
    startExportTransition(async () => {
      const [reportsResult, checklistResult] = await Promise.all([
        getAllReportsForExport(),
        getChecklistAction(),
      ]);

      if (!reportsResult.success || !reportsResult.data) {
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description:
            reportsResult.error || 'Could not fetch reports for export.',
        });
        return;
      }
      if (!checklistResult.success || !checklistResult.data) {
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description:
            checklistResult.error || 'Could not fetch checklist for headers.',
        });
        return;
      }

      if (reportsResult.data.length === 0) {
        toast({
          title: 'No Reports',
          description: 'There are no reports to export.',
        });
        return;
      }

      const allItems = checklistResult.data.flatMap(
        (category): any => category.items
      );

      const headers = [
        'Report ID',
        'Vehicle Registration',
        'Driver Name',
        'Odometer',
        'Date',
        'Final Verdict',
        ...allItems.flatMap((item) => [
          `${item.name} - Status`,
          `${item.name} - Notes`,
        ]),
      ];

      const data = reportsResult.data.map((report) => {
        const row: Record<string, any> = {
          'Report ID': report.id,
          'Vehicle Registration': report.vehicleRegistration,
          'Driver Name': report.driverName,
          Odometer: report.currentOdometer,
          Date: new Date(report.submittedAt.seconds * 1000).toLocaleString(),
          'Final Verdict': report.finalVerdict,
        };

        allItems.forEach((itemTemplate) => {
          const reportItem = report.items?.find(
            (i) => i.id === itemTemplate.id
          );
          row[`${itemTemplate.name} - Status`] = reportItem?.status || 'N/A';
          row[`${itemTemplate.name} - Notes`] = reportItem?.notes || '';
        });

        return row;
      });

      const csv = Papa.unparse({
        fields: headers,
        data: data.map((row) => headers.map((header) => row[header])),
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `vehicle-check-reports-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Your report data has been downloaded.',
      });
    });
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Inspection Reports
          </h2>
          <p className="text-muted-foreground">
            Browse, search, and filter all vehicle inspection reports for your
            organization.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle or driver..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full md:w-[200px] justify-between"
                  >
                    {statusFilter
                      ? verdicts.find((v) => v.value === statusFilter)?.label
                      : 'Filter by verdict...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search verdicts..." />
                    <CommandList>
                      <CommandEmpty>No verdict found.</CommandEmpty>
                      <CommandGroup>
                        {verdicts.map((v) => (
                          <CommandItem
                            key={v.value}
                            value={v.value}
                            onSelect={(currentValue) => {
                              setStatusFilter(
                                currentValue === statusFilter
                                  ? ''
                                  : currentValue.toUpperCase()
                              );
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                statusFilter === v.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              }`}
                            />
                            {v.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {statusFilter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStatusFilter('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export to Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Registration</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.vehicleRegistration}
                      </TableCell>
                      <TableCell>{report.driverName}</TableCell>
                      <TableCell>
                        {report.currentOdometer?.toLocaleString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          report.submittedAt.seconds * 1000
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.finalVerdict === 'PASS'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {report.finalVerdict}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/reports/${report.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
