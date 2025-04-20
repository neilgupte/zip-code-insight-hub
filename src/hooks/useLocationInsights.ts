
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LocationInsight } from "@/types/location";
import { toast } from "sonner";

export function useLocationInsights(
  selectedState: string,
  selectedCity: string,
  page: number,
  itemsPerPage: number,
  selectedIncomeBracket?: string,
  selectedCompositeScores?: string[]
) {
  const fetchLocationInsights = async (): Promise<LocationInsight[]> => {
    try {
      // Build base query using the location_insights view
      let query = supabase
        .from('location_insights')
        .select('*');

      // Apply filters
      if (selectedState !== 'all') {
        query = query.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      }
      
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      // Apply composite score filter
      if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
        let minScore = null;
        let maxScore = null;
        
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

        if (minScore !== null && maxScore !== null) {
          query = query.gte('composite_score', minScore).lte('composite_score', maxScore);
        }
      }
      
      // Apply pagination
      query = query
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('composite_score', { ascending: false });

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

      return locationData;
      
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
      selectedCity,
      selectedIncomeBracket,
      selectedCompositeScores ? selectedCompositeScores.join(',') : '',
      page
    ],
    queryFn: fetchLocationInsights
  });
}
