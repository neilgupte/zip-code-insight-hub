
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
  competitors: string | null;
  state_name: string;
  median_divorce_rate: number | null;
  composite_score: number | null;
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

  const fetchLocationInsights = async (): Promise<LocationInsight[]> => {
    // Converting state name to have first letter capitalized
    const formattedStateName = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
    
    // Using RPC call to workaround the type definition issue since views aren't in the types
    const { data, error } = await supabase
      .rpc('get_location_insights', {
        state_filter: formattedStateName,
        city_filter: selectedCity !== 'all' ? (selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)) : null,
        min_score: selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all') 
          ? (selectedCompositeScores.includes('low') ? 1 : selectedCompositeScores.includes('medium') ? 8 : 15) : null,
        max_score: selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')
          ? (selectedCompositeScores.includes('low') ? 7 : selectedCompositeScores.includes('medium') ? 14 : 20) : null,
        page_number: page,
        items_per_page: itemsPerPage
      });
    
    if (error) {
      console.error("Error fetching location insights:", error);
      
      // Fallback to direct SQL query if RPC not available yet
      // This is a workaround for the typing issues with views
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('location as l')
        .select(`
          l.zip,
          l.city,
          l.population as households,
          l."Competitors" as competitors,
          l.state_name,
          ds.median_divorce_rate,
          ds."Divorce Rate Score" as composite_score,
          l.population * 3500 as tam,
          l.population * 3500 * 0.15 as sam
        `)
        .eq('l.state_name', formattedStateName)
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('population', { ascending: false })
        .leftJoin('divorce_score as ds', 'l.zip = ds.zip');
      
      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw fallbackError;
      }
      
      return (fallbackData || []) as LocationInsight[];
    }
    
    return (data || []) as LocationInsight[];
  };

  const { data: locations, isLoading } = useQuery<LocationInsight[]>({
    queryKey: [
      "location_insights", 
      selectedState, 
      selectedCity, 
      selectedIncomeBracket, 
      selectedCompositeScores,
      page
    ],
    queryFn: fetchLocationInsights
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
            {locations && locations.map((location) => (
              <TableRow key={location.zip}>
                <TableCell>{location.zip}</TableCell>
                <TableCell>{location.city}</TableCell>
                <TableCell>{location.households?.toLocaleString() || 'N/A'}</TableCell>
                <TableCell>{location.median_divorce_rate?.toFixed(2) || 'N/A'}%</TableCell>
                <TableCell>{location.composite_score?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell>{location.competitors || 'N/A'}</TableCell>
                <TableCell>${location.tam?.toLocaleString() || 'N/A'}</TableCell>
                <TableCell>${location.sam?.toLocaleString() || 'N/A'}</TableCell>
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
