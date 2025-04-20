
import { LocationInsight } from "@/types/location";

export function generateDummyData(): LocationInsight[] {
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
      median_divorce_rate: Math.random() * 10 + 5,
      composite_score: Math.floor(Math.random() * 20) + 1,
      tam: tam,
      sam: sam
    });
  }
  
  return dummyData;
}
