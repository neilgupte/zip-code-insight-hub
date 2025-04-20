
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
import { Skeleton } from "@/components/ui/skeleton";

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
    
    // Build the filters for composite scores
    let minScore = null;
    let maxScore = null;
    
    if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
      if (selectedCompositeScores.includes('low')) {
        minScore = 1;
        maxScore = 7;
      } else if (selectedCompositeScores.includes('medium')) {
        minScore = 8;
        maxScore = 14;
      } else if (selectedCompositeScores.includes('high')) {
        minScore = 15;
        maxScore = 20;
      }
    }
    
    try {
      // First attempt with RPC call
      const { data, error } = await supabase.rpc('get_location_insights', {
        state_filter: formattedStateName,
        city_filter: selectedCity !== 'all' ? (selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)) : null,
        min_score: minScore,
        max_score: maxScore,
        page_number: page,
        items_per_page: itemsPerPage
      });
      
      if (error) {
        console.error("Error fetching with RPC:", error);
        throw error;
      }
      
      return (data || []) as LocationInsight[];
    } catch (rpcError) {
      console.log("RPC failed, using fallback query:", rpcError);
      
      // Fallback direct query
      let query = supabase
        .from('location')
        .select(`
          zip,
          city,
          population as households,
          "Competitors" as competitors,
          state_name
        `)
        .eq('state_name', formattedStateName)
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('population', { ascending: false });
        
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      const { data: locationData, error: locationError } = await query;
      
      if (locationError) {
        console.error("Fallback query failed:", locationError);
        throw locationError;
      }
      
      // Query divorce score separately and join manually
      const { data: divorceData } = await supabase
        .from('divorce_score')
        .select('zip, median_divorce_rate, "Divorce Rate Score" as composite_score');
        
      // Convert and join data manually
      const results = locationData.map(location => {
        const divorceInfo = divorceData?.find(d => d.zip === location.zip) || {};
        
        return {
          ...location,
          median_divorce_rate: divorceInfo.median_divorce_rate || null,
          composite_score: divorceInfo.composite_score || null,
          tam: (location.households || 0) * 3500,
          sam: (location.households || 0) * 3500 * 0.15
        };
      });
      
      return results as LocationInsight[];
    }
  };

  const { data: locations, isLoading } = useQuery({
    queryKey: [
      "location_insights", 
      selectedState, 
      selectedCity, 
      selectedIncomeBracket, 
      selectedCompositeScores ? selectedCompositeScores.join(',') : '',
      page
    ],
    queryFn: fetchLocationInsights
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

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
