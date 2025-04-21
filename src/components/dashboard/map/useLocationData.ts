
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  state_name: string;
  Competitors?: string;
  composite_score?: number;
}

export const useLocationData = (
  selectedState: string,
  selectedCompositeScores: string[]
) => {
  return useQuery({
    queryKey: ['map-locations', selectedState, selectedCompositeScores],
    queryFn: async () => {
      try {
        console.log("Fetching map data for state:", selectedState);
        
        // Return empty array if "all" is selected
        if (selectedState === 'all') {
          console.log("All states selected - skipping map query");
          return [];
        }
        
        // Format state name for query
        const stateFormatted = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
        console.log("Formatted state name for map:", stateFormatted);
        
        // Query the location table for map data
        const { data: locationData, error: locationError } = await supabase
          .from('location')
          .select(`
            zip,
            lat,
            lng,
            city,
            state_name, 
            Competitors
          `)
          .eq('state_name', stateFormatted);
        
        if (locationError) {
          console.error("Error fetching map location data:", locationError);
          toast.error("Error loading map data");
          return [];
        }
        
        if (!locationData || locationData.length === 0) {
          console.log(`No location data found for ${stateFormatted}`);
          return [];
        }

        console.log(`Found ${locationData.length} locations for map`);

        // Get zip codes from location data
        const zipCodes = locationData.map(loc => loc.zip);

        // Fetch divorce and income scores to calculate composite scores
        const { data: divorceScores, error: divorceError } = await supabase
          .from('divorce_score')
          .select('*')
          .in('zip', zipCodes);
          
        if (divorceError) {
          console.error("Error fetching divorce scores:", divorceError);
          toast.error("Error loading divorce scores");
        }
        
        const { data: incomeScores, error: incomeError } = await supabase
          .from('income_score')
          .select('*')
          .in('zip', zipCodes);
          
        if (incomeError) {
          console.error("Error fetching income scores:", incomeError);
          toast.error("Error loading income scores");
        }
        
        // Create lookup maps for scores
        const divorceScoreMap = new Map();
        if (divorceScores) {
          divorceScores.forEach(score => {
            divorceScoreMap.set(score.zip, parseFloat(score["Divorce Rate Score"] || '0'));
          });
        }
        
        const incomeScoreMap = new Map();
        if (incomeScores) {
          incomeScores.forEach(score => {
            incomeScoreMap.set(score.zip, parseFloat(score["Household Income Score"] || '0'));
          });
        }
        
        // Transform the data and add composite scores
        const transformedData = locationData
          .filter(location => location.lat && location.lng) // Filter out locations with missing coordinates
          .map(location => {
            // Calculate composite score: (Divorce Rate Score + Household Income Score) / 2
            const divorceRateScore = divorceScoreMap.get(location.zip) || 0;
            const householdIncomeScore = incomeScoreMap.get(location.zip) || 0;
            const compositeScore = (divorceRateScore + householdIncomeScore) / 2;
            
            return {
              zip: location.zip,
              lat: location.lat,
              lng: location.lng,
              city: location.city || 'Unknown',
              state_name: location.state_name || 'Unknown',
              Competitors: location.Competitors,
              composite_score: compositeScore
            };
          });
        
        console.log(`Transformed ${transformedData.length} locations for map`);
        
        // If composite score filters are applied, filter the results client-side
        if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
          const filteredData = transformedData.filter(location => {
            const score = location.composite_score || 0;
            
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
          
          console.log(`Filtered to ${filteredData.length} map locations based on composite score`);
          return filteredData;
        }
        
        return transformedData;
      } catch (error) {
        console.error("Error fetching location data for map:", error);
        toast.error("Failed to load map data. Please try again.");
        return [];
      }
    },
  });
};

export type { LocationData };
