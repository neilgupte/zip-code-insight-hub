
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  zip: number;
  lat: number;
  lng: number;
  city: string;
  state_name: string;
  Competitors?: string;
  composite_score?: number;
}

export const useLocationData = (
  selectedState: string,
  selectedCity: string,
  selectedCompositeScores: string[]
) => {
  return useQuery({
    queryKey: ['map-locations', selectedState, selectedCity, selectedCompositeScores],
    queryFn: async () => {
      try {
        // Instead of querying from the location table directly,
        // we'll join with the location_insights view to get the composite score
        let query = supabase
          .from('location_insights')
          .select(`
            zip,
            city,
            state_name, 
            Competitors,
            composite_score,
            location:zip (
              lat,
              lng
            )
          `);
        
        // Add condition for state if not "all"
        if (selectedState !== 'all') {
          query = query.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
        }
        
        // Add condition for city if not "all"
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
        
        const { data, error } = await query.limit(50);
        
        if (error) {
          toast.error("Error loading map data: " + error.message);
          throw error;
        }
        
        if (!data || data.length === 0) {
          toast.warning(`No location data found for ${selectedState}, ${selectedCity}`);
          return [];
        }

        // Transform the data to match the LocationData interface
        const transformedData = data.map(item => ({
          zip: item.zip,
          lat: item.location?.lat,
          lng: item.location?.lng,
          city: item.city,
          state_name: item.state_name,
          Competitors: item.Competitors,
          composite_score: item.composite_score
        })).filter(item => item.lat && item.lng); // Filter out items with missing lat/lng
        
        return transformedData;
      } catch (error) {
        console.error("Error fetching location data:", error);
        toast.error("Failed to load map data. Please try again.");
        return [];
      }
    },
  });
};

export type { LocationData };
