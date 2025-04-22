
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_STYLES } from './constants';
import { LocationData } from './useLocationData';

export const useLocationMarkers = (
  map: React.MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  locations: LocationData[] | undefined,
  selectedState: string
) => {
  useEffect(() => {
    if (!map.current || !mapLoaded || !locations || locations.length === 0) {
      console.log("Skip adding markers: map not ready or no locations", { 
        mapReady: !!map.current, 
        mapLoaded, 
        locationsCount: locations?.length 
      });
      return;
    }

    console.log(`Adding ${locations.length} markers to map`);

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    locations.forEach(loc => {
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 15
      });

      // Determine marker color based on composite score
      let markerColor = MAP_STYLES.markerColors.high; // Default to green
      const score = loc.composite_score || 0;
      
      if (score <= 7) {
        markerColor = MAP_STYLES.markerColors.low; // Red for low scores
      } else if (score <= 14) {
        markerColor = MAP_STYLES.markerColors.medium; // Yellow for medium scores
      }

      new mapboxgl.Marker({
        color: markerColor,
        scale: 0.7
      })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(
          popup.setHTML(`
            <div class="p-2">
              <h3 class="font-bold">ZIP: ${loc.zip}</h3>
              <p>City: ${loc.city}</p>
              <p>Composite Score: ${loc.composite_score?.toFixed(2) || 'N/A'}</p>
            </div>
          `)
        )
        .addTo(map.current!);
    });

    // Fit bounds to show all markers
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
      bounds.extend([loc.lng, loc.lat]);
    });
    
    map.current?.fitBounds(bounds, { 
      padding: 50,
      maxZoom: 10
    });
        
    console.log("Map markers added successfully");
  }, [locations, mapLoaded, selectedState]);
};
