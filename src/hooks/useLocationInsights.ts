
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
      // If "all" is selected, return empty array
      if (selectedState === 'all') {
        console.log("Please select a specific state to view data");
        return [];
      }

      const formattedStateName = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
      
      // Calculate composite score range if filters are applied
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

      // Build base query
      let query = supabase
        .from('location')
        .select(`
          zip,
          city,
          population,
          state_name,
          Competitors,
          divorce_score (
            median_divorce_rate,
            "Divorce Rate Score"
          ),
          income_score (
            "# of households with more than 200K income",
            "Household Income Score"
          )
        `);

      // Apply filters
      if (selectedState !== 'all') {
        query = query.eq('state_name', formattedStateName);
      }
      
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      // Apply pagination
      query = query
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('population', { ascending: false });

      const { data: locationData, error: locationError } = await query;

      if (locationError) {
        console.error("Location query failed:", locationError);
        throw locationError;
      }

      if (!locationData || locationData.length === 0) {
        console.log("No data available for the selected filters");
        return [];
      }

      // Transform and filter the data
      const results = locationData
        .map(location => {
          // Handle potentially empty arrays with null checks and defaults
          const divorceInfoArray = location.divorce_score || [];
          const divorceInfo = divorceInfoArray.length > 0 ? divorceInfoArray[0] : {};
          
          const incomeInfoArray = location.income_score || [];
          const incomeInfo = incomeInfoArray.length > 0 ? incomeInfoArray[0] : {};
          
          // Calculate derived values
          const households = Math.round((location.population || 0) / 2.5);
          const tam = households * 3500;
          const sam = Math.round(tam * 0.15);
          
          // Safely access properties with optional chaining and nullish coalescing
          const compositeScore = divorceInfo?.["Divorce Rate Score"] || null;
          const medianDivorceRate = divorceInfo?.median_divorce_rate || null;

          // Filter out records if they don't match the composite score range
          if (minScore !== null && maxScore !== null && compositeScore !== null) {
            if (compositeScore < minScore || compositeScore > maxScore) {
              return null;
            }
          }

          return {
            zip: location.zip,
            city: location.city,
            households: households,
            competitors: location.Competitors || '0',
            state_name: location.state_name,
            median_divorce_rate: medianDivorceRate,
            composite_score: compositeScore,
            tam: tam,
            sam: sam
          } as LocationInsight;
        })
        .filter(Boolean) as LocationInsight[];

      return results;
      
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
