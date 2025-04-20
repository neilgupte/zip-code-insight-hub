
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

// Define the type for divorce data to avoid type errors
interface DivorceData {
  zip: number | null;
  median_divorce_rate: number | null;
  "Divorce Rate Score": number | null;
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
      // First, query the location table
      let query = supabase
        .from('location')
        .select(`
          zip,
          city,
          population,
          "Competitors",
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
        console.error("Location query failed:", locationError);
        throw locationError;
      }
      
      if (!locationData || locationData.length === 0) {
        return [];
      }
      
      // Query divorce score separately
      const zipCodes = locationData.map(loc => loc.zip);
      const { data: divorceData, error: divorceError } = await supabase
        .from('divorce_score')
        .select('*')
        .in('zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce score query failed:", divorceError);
      }
      
      // Convert and join data manually
      const results = locationData.map(location => {
        // Cast divorceData to the correct type and use empty array if null/undefined
        const typedDivorceData = (divorceData || []) as DivorceData[];
        // Find matching divorce info or use an object with the expected properties
        const divorceInfo = typedDivorceData.find(d => d.zip === location.zip) || {
          median_divorce_rate: null,
          "Divorce Rate Score": null
        };
        
        const households = location.population || 0;
        const tam = households * 3500;
        const sam = tam * 0.15;
        
        // Apply score filtering if needed
        const compositeScore = divorceInfo["Divorce Rate Score"] || null;
        
        // Skip items that don't match the score filter
        if (minScore !== null && maxScore !== null && compositeScore !== null) {
          if (compositeScore < minScore || compositeScore > maxScore) {
            return null;
          }
        }
        
        return {
          zip: location.zip,
          city: location.city,
          households: households,
          competitors: location.Competitors,
          state_name: location.state_name,
          median_divorce_rate: divorceInfo.median_divorce_rate || null,
          composite_score: compositeScore,
          tam: tam,
          sam: sam
        } as LocationInsight;
      }).filter(Boolean) as LocationInsight[]; // Filter out null values from score filtering
      
      return results;
    } catch (error) {
      console.error("Error fetching location insights:", error);
      throw error;
    }
  };

  const { data: locations, isLoading, error } = useQuery({
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

  if (error) {
    console.error("Query error:", error);
    return <div className="text-red-500">Error loading data: {(error as Error).message}</div>;
  }

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
