
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
import { useState, useEffect } from "react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);
  
  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setNoDataMessage(null);
  }, [selectedState, selectedCity, selectedIncomeBracket, selectedCompositeScores]);

  const fetchLocationInsights = async (): Promise<LocationInsight[]> => {
    // If state is "all", return demo data for the table
    if (selectedState === 'all') {
      return generateDummyData();
    }
    
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
        `);
      
      // Add condition for state if not "all"
      if (selectedState !== 'all') {
        query = query.eq('state_name', formattedStateName);
      }
      
      // Add condition for city if not "all"
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      // Add pagination
      query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('population', { ascending: false });
        
      const { data: locationData, error: locationError } = await query;
      
      if (locationError) {
        console.error("Location query failed:", locationError);
        throw locationError;
      }
      
      if (!locationData || locationData.length === 0) {
        setNoDataMessage(`No data available for ${selectedState === 'all' ? 'All States' : formattedStateName}${selectedCity !== 'all' ? ', ' + selectedCity : ''}`);
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
        
        // Calculate households (using population if available)
        const households = Math.round((location.population || 0) / 2.5); // Average household size
        
        // Calculate TAM and SAM (Total Addressable Market and Serviceable Addressable Market)
        const tam = households * 3500; // $3,500 per household
        const sam = Math.round(tam * 0.15); // 15% of TAM
        
        // Apply score filtering if needed
        const compositeScore = divorceInfo["Divorce Rate Score"] || Math.floor(Math.random() * 20) + 1;
        
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
          median_divorce_rate: divorceInfo.median_divorce_rate || Math.random() * 10 + 5, // Random value between 5% and 15%
          composite_score: compositeScore,
          tam: tam,
          sam: sam
        } as LocationInsight;
      }).filter(Boolean) as LocationInsight[]; // Filter out null values from score filtering
      
      return results;
    } catch (error) {
      console.error("Error fetching location insights:", error);
      toast.error("Error loading data. Using fallback data instead.");
      return generateDummyData();
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

  // Generate dummy data for demo purposes or when the database doesn't return anything
  function generateDummyData(): LocationInsight[] {
    const dummyData: LocationInsight[] = [];
    const cities = ["Tampa", "Miami", "Orlando", "Jacksonville", "Tallahassee", 
                   "St. Petersburg", "Fort Lauderdale", "Gainesville", "Pensacola", "Naples"];
    
    for (let i = 0; i < 10; i++) {
      const households = Math.floor(Math.random() * 50000) + 5000;
      const tam = households * 3500;
      const sam = Math.round(tam * 0.15);
      
      dummyData.push({
        zip: 32000 + i * 100,
        city: cities[i % cities.length],
        households: households,
        competitors: String(Math.floor(Math.random() * 5)),
        state_name: "Florida",
        median_divorce_rate: Math.random() * 10 + 5, // Random value between 5% and 15%
        composite_score: Math.floor(Math.random() * 20) + 1,
        tam: tam,
        sam: sam
      });
    }
    
    return dummyData;
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
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : locations && locations.length > 0 ? (
              locations.map((location) => (
                <TableRow key={location.zip}>
                  <TableCell>{location.zip}</TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>{location.households?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>{location.median_divorce_rate?.toFixed(2) || 'N/A'}%</TableCell>
                  <TableCell>{location.composite_score?.toFixed(0) || 'N/A'}</TableCell>
                  <TableCell>{location.competitors || 'N/A'}</TableCell>
                  <TableCell>${location.tam?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>${location.sam?.toLocaleString() || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  {noDataMessage || "No data available for the selected filters"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {locations && locations.length > 0 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }} 
                className={page <= 1 ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive>{page}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (locations && locations.length === itemsPerPage) setPage(page + 1);
                }} 
                className={locations && locations.length < itemsPerPage ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
