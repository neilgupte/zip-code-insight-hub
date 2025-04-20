
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// You'll need to create a Mapbox account and obtain a public token
// https://account.mapbox.com
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS10ZWFtIiwiYSI6ImNsd3RuNnpuMzAxZnEyam1vYnI5cmJ3dTIifQ.sTr91_MDEyBBugRXWwFUWw';

interface MapComponentProps {
  selectedState?: string;
  selectedCity?: string;
  selectedCompositeScores?: string[];
}

interface LocationData {
  zip: number;
  lat: number;
  lng: number;
  city: string;
  state_name: string;
  Competitors?: string;
  composite_score?: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedState = 'florida',
  selectedCity = 'all',
  selectedCompositeScores = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Fetch location data with composite scores
  const { data: locations, isLoading } = useQuery({
    queryKey: ['map-locations', selectedState, selectedCity, selectedCompositeScores],
    queryFn: async () => {
      let query = supabase
        .from('location')
        .select('*')
        .eq('state_name', selectedState === 'florida' ? 'Florida' : selectedState);
      
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity);
      }
      
      // We'd normally join with a composite_score table but we'll simulate it with mockup data
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      // Add mock composite scores for visualization
      return data.map((loc) => ({
        ...loc,
        composite_score: Math.floor(Math.random() * 20) + 1 // Mock score between 1-20
      }));
    },
  });

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-82.5, 28.0], // Center on Florida
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add/update markers when location data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !locations || locations.length === 0) return;

    // Remove existing markers if any
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add source and layer for location points
    if (map.current.getSource('locations')) {
      map.current.removeLayer('location-points');
      map.current.removeSource('locations');
    }

    map.current.addSource('locations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: locations.map(loc => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [loc.lng, loc.lat]
          },
          properties: {
            zip: loc.zip,
            city: loc.city,
            composite_score: loc.composite_score,
            competitors: loc.Competitors || 'None'
          }
        }))
      }
    });

    // Add colored circles based on composite score
    map.current.addLayer({
      id: 'location-points',
      type: 'circle',
      source: 'locations',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'composite_score'],
          1, 5,   // Min score
          20, 15  // Max score
        ],
        'circle-color': [
          'interpolate', ['linear'], ['get', 'composite_score'],
          1, '#f2fcE2',  // Low score (soft green)
          10, '#9b87f5', // Medium score (purple)
          20, '#8B5CF6'  // High score (vivid purple)
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Add popups
    locations.forEach(loc => {
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 15
      });

      const marker = new mapboxgl.Marker({
        color: 'transparent',
        scale: 0
      })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(
          popup.setHTML(`
            <div class="p-2">
              <h3 class="font-bold">ZIP: ${loc.zip}</h3>
              <p>City: ${loc.city}</p>
              <p>Composite Score: ${loc.composite_score}</p>
              <p>Competitors: ${loc.Competitors || 'None'}</p>
            </div>
          `)
        )
        .addTo(map.current);
    });

    // Center map to fit all points
    if (locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => {
        bounds.extend([loc.lng, loc.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locations, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 rounded-md" />
      <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-md shadow-md">
        <h4 className="text-sm font-semibold mb-2">Composite Score</h4>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f2fcE2]"></div>
          <span className="text-xs">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#9b87f5]"></div>
          <span className="text-xs">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
          <span className="text-xs">High</span>
        </div>
      </div>
    </div>
  );
};
