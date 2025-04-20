
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface LocationInsight {
  zip: number;
  city: string;
  households: number;
  competitors: string;
  state_name: string;
  median_divorce_rate: number;
  composite_score: number;
  tam: number;
  sam: number;
}

export const DataTable = ({ 
  selectedState, 
  selectedCity, 
  selectedIncomeBracket, 
  selectedCompositeScores 
}: { 
  selectedState: string, 
  selectedCity: string, 
  selectedIncomeBracket?: string, 
  selectedCompositeScores?: string[] 
}) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: locations, isLoading } = useQuery<LocationInsight[]>({
    queryKey: [
      "location_insights", 
      selectedState, 
      selectedCity, 
      selectedIncomeBracket, 
      selectedCompositeScores,
      page
    ],
    queryFn: async () => {
      let query = supabase
        .from('location_insights')
        .select('*')
        .eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1))
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('tam', { ascending: false });

      // Apply city filter if not 'all'
      if (selectedCity && selectedCity !== 'all') {
        query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }

      // Apply composite score filter
      if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
        query = query.gte('composite_score', 
          selectedCompositeScores.includes('low') ? 1 : 
          selectedCompositeScores.includes('medium') ? 8 : 15
        ).lte('composite_score', 
          selectedCompositeScores.includes('low') ? 7 : 
          selectedCompositeScores.includes('medium') ? 14 : 20
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div>Loading...</div>;

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
            {locations?.map((location) => (
              <TableRow key={location.zip}>
                <TableCell>{location.zip}</TableCell>
                <TableCell>{location.city}</TableCell>
                <TableCell>{location.households.toLocaleString()}</TableCell>
                <TableCell>{location.median_divorce_rate?.toFixed(2) || 'N/A'}%</TableCell>
                <TableCell>{location.composite_score?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell>{location.competitors || 'N/A'}</TableCell>
                <TableCell>${location.tam.toLocaleString()}</TableCell>
                <TableCell>${location.sam.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }} 
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                if (locations && locations.length === itemsPerPage) setPage(page + 1);
              }} 
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
