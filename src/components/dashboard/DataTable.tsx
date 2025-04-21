
import { useState, useEffect } from "react";
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
  const itemsPerPage = 10;
  
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

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zip</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Households</TableHead>
              <TableHead>Median Divorce Rate</TableHead>
              <TableHead>Composite Score</TableHead>
              <TableHead>Competitors</TableHead>
              <TableHead>TAM</TableHead>
              <TableHead>SAM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
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
        <TablePagination
          page={page}
          itemsPerPage={itemsPerPage}
          itemCount={locations.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
