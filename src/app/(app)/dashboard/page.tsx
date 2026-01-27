import { getDashboardStats } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  FileText, 
  Truck, 
  Users, 
  AlertCircle 
} from 'lucide-react';

export default async function DashboardPage() {
  const statsResult = await getDashboardStats();

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>Error loading stats: {statsResult.error}</p>
      </div>
    );
  }

  const { data: stats, isSuperAdmin } = statsResult;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          {isSuperAdmin 
            ? 'Overview of activities' 
            : 'Overview of your organization\'s fleet and inspections.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Super Admin: Organizations Count */}
        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.organizations}</div>
              <p className="text-xs text-muted-foreground">
                Active on platform
              </p>
            </CardContent>
          </Card>
        )}

        {/* All Users: Report Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isSuperAdmin ? 'Total Reports' : 'Reports Generated'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reports}</div>
            <p className="text-xs text-muted-foreground">
              {isSuperAdmin ? 'Across all orgs' : 'Total inspections logged'}
            </p>
          </CardContent>
        </Card>

        {/* Org Admin Only: Vehicles */}
        {!isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Vehicles
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vehicles}</div>
              <p className="text-xs text-muted-foreground">
                Registered in fleet
              </p>
            </CardContent>
          </Card>
        )}

        {/* Org Admin Only: Drivers */}
        {!isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Drivers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drivers}</div>
              <p className="text-xs text-muted-foreground">
                Registered drivers
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}