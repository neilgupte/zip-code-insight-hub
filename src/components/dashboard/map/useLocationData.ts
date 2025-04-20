
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
        let query = supabase
          .from('location')
          .select('*');
        
        // Add condition for state if not "all"
        if (selectedState !== 'all') {
          query = query.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
        }
        
        // Add condition for city if not "all"
        if (selectedCity !== 'all') {
          query = query.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
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
        
        // Filter by composite score if needed
        let filteredData = data;
        if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
          // Will be implemented when composite scores are available in the API
        }
        
        return filteredData;
      } catch (error) {
        console.error("Error fetching location data:", error);
        toast.error("Failed to load map data. Please try again.");
        return [];
      }
    },
  });
};

export type { LocationData };
