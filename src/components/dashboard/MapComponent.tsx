
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { MAPBOX_TOKEN, MAP_STYLES, getMapCenter } from './map/constants';
import { useLocationData, type LocationData } from './map/useLocationData';
import { Legend } from './map/Legend';

interface MapComponentProps {
  selectedState?: string;
  selectedCity?: string;
  selectedCompositeScores?: string[];
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedState = 'florida',
  selectedCity = 'all',
  selectedCompositeScores = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { data: locations, isLoading } = useLocationData(selectedState, selectedCity, selectedCompositeScores);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const { center, zoom } = getMapCenter(selectedState);
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
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
  }, [selectedState]);

  // Add/update markers when location data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !locations || locations.length === 0) return;

    // Remove existing markers and layers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

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

    map.current.addLayer({
      id: 'location-points',
      type: 'circle',
      source: 'locations',
      paint: {
        'circle-radius': MAP_STYLES.circleRadius,
        'circle-color': MAP_STYLES.circleColor,
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

      new mapboxgl.Marker({
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
  }, [locations, mapLoaded, selectedState, selectedCity, selectedCompositeScores]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 rounded-md" />
      <Legend />
    </div>
  );
};
