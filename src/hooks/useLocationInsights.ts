
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LocationInsight } from "@/types/location";
import { toast } from "sonner";

export function useLocationInsights(
  selectedState: string,
  page: number,
  itemsPerPage: number,
  selectedIncomeBracket?: string,
  selectedCompositeScores?: string[]
) {
  const fetchLocationInsights = async (): Promise<LocationInsight[]> => {
    try {
      // Query the location table which exists in our database
      let query = supabase
        .from('location')
        .select('*');

      // Apply state filter
      if (selectedState !== 'all') {
        query = query.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      }
      
      // Apply pagination
      query = query
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      const { data: locationData, error: locationError } = await query;

      if (locationError) {
        console.error("Location query failed:", locationError);
        toast.error("Error loading location data");
        throw locationError;
      }

      if (!locationData || locationData.length === 0) {
        console.log("No data available for the selected filters");
        return [];
      }

      // Transform the data to match the LocationInsight interface
      const transformedData: LocationInsight[] = locationData.map(location => {
        // Generate placeholder values for missing fields
        const households = Math.floor(Math.random() * 10000) + 1000;
        const medianDivorceRate = Math.random() * 10 + 2; // 2-12%
        const compositeScore = Math.floor(Math.random() * 20) + 1; // 1-20
        const tam = households * 1000; // Placeholder calculation
        const sam = Math.floor(tam * 0.3); // Placeholder calculation
        
        return {
          zip: parseInt(location.zip),
          city: location.city || "Unknown",
          households: households,
          Competitors: location.Competitors,
          state_name: location.state_name || "Unknown",
          median_divorce_rate: medianDivorceRate,
          composite_score: compositeScore,
          tam: tam,
          sam: sam
        };
      });

      // Apply composite score filter if needed
      if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
        return transformedData.filter(insight => {
          const score = insight.composite_score || 0;
          
          if (selectedCompositeScores.includes('low') && score >= 1 && score <= 7) {
            return true;
          }
          
          if (selectedCompositeScores.includes('medium') && score >= 8 && score <= 14) {
            return true;
          }
          
          if (selectedCompositeScores.includes('high') && score >= 15 && score <= 20) {
            return true;
          }
          
          return false;
        });
      }

      return transformedData;
    } catch (error) {
      console.error("Error fetching location insights:", error);
      toast.error("Error loading data. Please try again later.");
      return [];
    }
  };

  return useQuery({
    queryKey: [
      "location_insights",
      selectedState,
      selectedIncomeBracket,
      selectedCompositeScores ? selectedCompositeScores.join(',') : '',
      page
    ],
    queryFn: fetchLocationInsights
  });
}
