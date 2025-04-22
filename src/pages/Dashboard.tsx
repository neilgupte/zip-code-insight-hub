import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { Charts } from "@/components/dashboard/Charts";
import { MapComponent } from "@/components/dashboard/MapComponent";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { RawDataTables } from "@/components/dashboard/RawDataTables";

const Dashboard = () => {
  const [selectedState, setSelectedState] = useState("florida");
  const [selectedIncomeBracket, setSelectedIncomeBracket] = useState("");
  const [selectedCompositeScores, setSelectedCompositeScores] = useState<string[]>(["all"]);

  const handleStateChange = (state: string) => {
    console.log("State changed to:", state);
    setSelectedState(state);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">DivorceIQ Dashboard</h1>
        
        <DashboardHeader 
          onStateChange={handleStateChange}
          onIncomeBracketChange={income => setSelectedIncomeBracket(income)} 
          onCompositeScoreChange={scores => setSelectedCompositeScores(scores)} 
          initialState={selectedState}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg p-4 h-[600px]">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Opportunity Map (Based on AGI Score)</h2>
                <Button variant="secondary" className="bg-[#d4b8a8] hover:bg-[#c5a999] text-black">
                  Expand Map
                </Button>
              </div>
              <div className="h-[520px] rounded-md overflow-hidden">
                <MapComponent 
                  selectedState={selectedState} 
                  selectedCompositeScores={selectedCompositeScores} 
                />
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-4 h-[600px]">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Top TAM {selectedState === 'all' ? 'All' : selectedState.charAt(0).toUpperCase() + selectedState.slice(1)}
                  {selectedCompositeScores.length > 0 && selectedCompositeScores[0] !== 'all' && ` (Score is based on Commute Radius)`}
                </h2>
                <DataTable 
                  selectedState={selectedState} 
                  selectedIncomeBracket={selectedIncomeBracket} 
                  selectedCompositeScores={selectedCompositeScores} 
                />
              </div>
            </div>
          </div>
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="min-h-[400px] rounded-lg border mb-4">
          <ResizablePanel defaultSize={50}>
            <div className="p-2">
              <Charts selectedState={selectedState} chartType="divorce" />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="p-2">
              <Charts selectedState={selectedState} chartType="income" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <RawDataTables />
      </div>
    </div>
  );
};

export default Dashboard;
