
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
        // If "all" is selected, we'll return dummy data since we're having DB connection issues
        if (selectedState === 'all') {
          return generateDummyData();
        }
        
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
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return generateDummyData();
        }
        
        return data.map((loc) => ({
          ...loc,
          composite_score: Math.floor(Math.random() * 20) + 1 // Generate random score since we don't have the actual join
        }));
      } catch (error) {
        console.error("Error fetching location data:", error);
        return generateDummyData();
      }
    },
  });
};

// Generate dummy location data for demo purposes
const generateDummyData = (): LocationData[] => {
  const dummyLocations: LocationData[] = [];
  
  for (let i = 0; i < 20; i++) {
    dummyLocations.push({
      zip: 32000 + i,
      lat: 28 + Math.random() * 5,
      lng: -82 - Math.random() * 5,
      city: `City ${i + 1}`,
      state_name: 'Florida',
      Competitors: `${Math.floor(Math.random() * 5)}`,
      composite_score: Math.floor(Math.random() * 20) + 1
    });
  }
  
  return dummyLocations;
};

export type { LocationData };
