
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { Charts } from "@/components/dashboard/Charts";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">DivorceIQ Dashboard</h1>
        <DashboardHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Opportunity Map (Based on AGI Score)</h2>
            <div className="h-[400px] bg-muted rounded-md">
              {/* Map component will be added here */}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Top TAM Florida, All (Score is based on Commute Radius)</h2>
            <DataTable />
          </div>
        </div>
        
        <Charts />
      </div>
    </div>
  );
};

export default Dashboard;
