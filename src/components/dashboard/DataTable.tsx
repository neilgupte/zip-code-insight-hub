
import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocationInsights } from "@/hooks/useLocationInsights";
import { TableSkeleton } from "./TableSkeleton";
import { TablePagination } from "./TablePagination";
import { LocationInsight } from "@/types/location";

interface DataTableProps {
  selectedState: string;
  selectedIncomeBracket?: string;
  selectedCompositeScores?: string[];
}

export const DataTable = ({ 
  selectedState, 
  selectedIncomeBracket, 
  selectedCompositeScores 
}: DataTableProps) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 7; // Updated to show 7 rows
  
  useEffect(() => {
    setPage(1);
  }, [selectedState, selectedIncomeBracket, selectedCompositeScores]);

  const { data: locations, isLoading, error } = useLocationInsights(
    selectedState,
    page,
    itemsPerPage,
    selectedIncomeBracket,
    selectedCompositeScores
  );

  if (error) {
    console.error("Query error:", error);
    return <div className="text-red-500">Error loading data: {(error as Error).message}</div>;
  }

  const noDataMessage = selectedState === 'all' 
    ? "Please select a specific state to view data"
    : "No data available for the selected filters";

  const renderSortArrows = () => (
    <div className="inline-flex flex-col ml-1">
      <ArrowUp className="h-3 w-3" />
      <ArrowDown className="h-3 w-3" />
    </div>
  );

  return (
    <div className="h-[500px] flex flex-col justify-between">
      <div className="rounded-md border flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zip</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Households {renderSortArrows()}</TableHead>
              <TableHead>Median Divorce Rate</TableHead>
              <TableHead>Composite Score {renderSortArrows()}</TableHead>
              <TableHead>Competitors {renderSortArrows()}</TableHead>
              <TableHead>TAM {renderSortArrows()}</TableHead>
              <TableHead>SAM {renderSortArrows()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={8} />
            ) : locations && locations.length > 0 ? (
              locations.map((location: LocationInsight) => (
                <TableRow key={location.zip}>
                  <TableCell>{location.zip}</TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>{location.households?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>{location.median_divorce_rate?.toFixed(2) || 'N/A'}%</TableCell>
                  <TableCell>{location.composite_score?.toFixed(0) || 'N/A'}</TableCell>
                  <TableCell>{location.Competitors || 'N/A'}</TableCell>
                  <TableCell>${location.tam?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>${location.sam?.toLocaleString() || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  {noDataMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {locations && locations.length > 0 && (
        <div className="mt-2">
          <TablePagination
            page={page}
            itemsPerPage={itemsPerPage}
            itemCount={locations.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
