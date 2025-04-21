
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
        
        // Query the location table
        let locationQuery = supabase
          .from('location')
          .select(`
            zip,
            lat,
            lng,
            city,
            state_name, 
            Competitors
          `);
        
        // Add condition for state if not "all"
        if (selectedState !== 'all') {
          locationQuery = locationQuery.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
        }
        
        // Limit to 50 records to avoid performance issues
        const { data: locationData, error: locationError } = await locationQuery.limit(50);
        
        if (locationError) {
          console.error("Error fetching map location data:", locationError);
          toast.error("Error loading map data");
          return generateDummyMapData(selectedState);
        }
        
        if (!locationData || locationData.length === 0) {
          console.log(`No location data found for ${selectedState}, using dummy data`);
          return generateDummyMapData(selectedState);
        }

        console.log(`Found ${locationData.length} locations for map`);

        // Transform the data to match the expected format
        const transformedData = locationData
          .map(location => {
            if (!location.lat || !location.lng) return null;
            
            // Generate a dummy composite score between 1-20 for demo purposes
            const dummyScore = Math.floor(Math.random() * 20) + 1;
            
            return {
              zip: location.zip,
              lat: location.lat,
              lng: location.lng,
              city: location.city || 'Unknown',
              state_name: location.state_name || 'Unknown',
              Competitors: location.Competitors,
              composite_score: dummyScore
            };
          })
          .filter(item => item !== null) as LocationData[];
        
        if (transformedData.length === 0) {
          console.log("No valid data after transformation, using dummy data");
          return generateDummyMapData(selectedState);
        }
        
        // If composite score filters are applied, filter the results client-side
        if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
          return transformedData.filter(location => {
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
        }
        
        return transformedData;
      } catch (error) {
        console.error("Error fetching location data for map:", error);
        toast.error("Failed to load map data. Please try again.");
        return generateDummyMapData(selectedState);
      }
    },
  });
};

// Generate dummy map data
const generateDummyMapData = (selectedState: string): LocationData[] => {
  console.log("Generating dummy map data");
  const result: LocationData[] = [];
  
  // Define state centers and cities for dummy data
  const stateCenters: Record<string, {lat: number, lng: number, cities: string[]}> = {
    'florida': {
      lat: 27.6648, 
      lng: -81.5158,
      cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee']
    },
    'california': {
      lat: 36.7783, 
      lng: -119.4179,
      cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose']
    },
    'texas': {
      lat: 31.9686, 
      lng: -99.9018,
      cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth']
    },
    'all': {
      lat: 39.8283, 
      lng: -98.5795,
      cities: ['New York', 'Chicago', 'Miami', 'Los Angeles', 'Seattle']
    }
  };
  
  // Use the selected state or default to 'all'
  const stateKey = selectedState.toLowerCase() in stateCenters ? selectedState.toLowerCase() : 'all';
  const stateInfo = stateCenters[stateKey];
  
  // Generate 10 random points around the state center
  for (let i = 0; i < 10; i++) {
    const latOffset = (Math.random() - 0.5) * 5;
    const lngOffset = (Math.random() - 0.5) * 5;
    
    result.push({
      zip: (10000 + Math.floor(Math.random() * 90000)).toString(),
      lat: stateInfo.lat + latOffset,
      lng: stateInfo.lng + lngOffset,
      city: stateInfo.cities[Math.floor(Math.random() * stateInfo.cities.length)],
      state_name: selectedState.charAt(0).toUpperCase() + selectedState.slice(1),
      Competitors: Math.floor(Math.random() * 6).toString(),
      composite_score: Math.floor(Math.random() * 20) + 1
    });
  }
  
  return result;
};

export type { LocationData };
