
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LocationInsight, DivorceData } from "@/types/location";
import { generateDummyData } from "@/utils/locationUtils";
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
    if (selectedState === 'all') {
      return generateDummyData();
    }
    
    const formattedStateName = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
    
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
      let query = supabase
        .from('location')
        .select(`
          zip,
          city,
          population,
          "Competitors",
          state_name
        `);
      
      if (selectedState !== 'all') {
        query = query.eq('state_name', formattedStateName);
      }
      
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('population', { ascending: false });
        
      const { data: locationData, error: locationError } = await query;
      
      if (locationError) {
        console.error("Location query failed:", locationError);
        throw locationError;
      }
      
      if (!locationData || locationData.length === 0) {
        return [];
      }
      
      const zipCodes = locationData.map(loc => loc.zip);
      const { data: divorceData, error: divorceError } = await supabase
        .from('divorce_score')
        .select('*')
        .in('zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce score query failed:", divorceError);
      }
      
      const results = locationData.map(location => {
        const typedDivorceData = (divorceData || []) as DivorceData[];
        const divorceInfo = typedDivorceData.find(d => d.zip === location.zip) || {
          median_divorce_rate: null,
          "Divorce Rate Score": null
        };
        
        const households = Math.round((location.population || 0) / 2.5);
        const tam = households * 3500;
        const sam = Math.round(tam * 0.15);
        const compositeScore = divorceInfo["Divorce Rate Score"] || Math.floor(Math.random() * 20) + 1;
        
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
          median_divorce_rate: divorceInfo.median_divorce_rate || Math.random() * 10 + 5,
          composite_score: compositeScore,
          tam: tam,
          sam: sam
        } as LocationInsight;
      }).filter(Boolean) as LocationInsight[];
      
      return results;
    } catch (error) {
      console.error("Error fetching location insights:", error);
      toast.error("Error loading data. Using fallback data instead.");
      return generateDummyData();
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
