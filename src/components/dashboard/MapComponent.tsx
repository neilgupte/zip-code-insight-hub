
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { MAPBOX_TOKEN, MAP_STYLES, getMapCenter } from './map/constants';
import { useLocationData, type LocationData } from './map/useLocationData';
import { Legend } from './map/Legend';

interface MapComponentProps {
  selectedState?: string;
  selectedCompositeScores?: string[];
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedState = 'florida',
  selectedCompositeScores = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { data: locations, isLoading } = useLocationData(selectedState, selectedCompositeScores);

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
      console.log("Map loaded successfully");
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
    if (!map.current || !mapLoaded || !locations || locations.length === 0) {
      console.log("Skip adding markers: map not ready or no locations", { 
        mapReady: !!map.current, 
        mapLoaded, 
        locationsCount: locations?.length 
      });
      return;
    }

    console.log(`Adding ${locations.length} markers to map`);

    // Remove existing markers and layers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Wait for map to be fully loaded before adding sources
    const addMapData = () => {
      try {
        if (map.current?.getSource('locations')) {
          map.current.removeLayer('location-points');
          map.current.removeSource('locations');
        }

        map.current?.addSource('locations', {
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

        map.current?.addLayer({
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

        // Add popups using standard markers
        locations.forEach(loc => {
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 15
          });

          new mapboxgl.Marker({
            color: '#8B5CF6', // Fixed color value instead of using non-existent MAP_STYLES.markerColor
            scale: 0.7
          })
            .setLngLat([loc.lng, loc.lat])
            .setPopup(
              popup.setHTML(`
                <div class="p-2">
                  <h3 class="font-bold">ZIP: ${loc.zip}</h3>
                  <p>City: ${loc.city}</p>
                  <p>Composite Score: ${loc.composite_score?.toFixed(2) || 'N/A'}</p>
                  <p>Competitors: ${loc.Competitors || 'None'}</p>
                </div>
              `)
            )
            .addTo(map.current!);
        });

        // Center map to fit all points
        if (locations.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          locations.forEach(loc => {
            bounds.extend([loc.lng, loc.lat]);
          });
          map.current?.fitBounds(bounds, { padding: 50 });
        }
        
        console.log("Map data added successfully");
      } catch (error) {
        console.error("Error adding data to map:", error);
      }
    };

    // If map is already loaded, add data immediately
    if (mapLoaded && map.current?.loaded()) {
      addMapData();
    } else {
      // Otherwise wait for the map to be loaded
      map.current?.once('load', addMapData);
    }
  }, [locations, mapLoaded]);

  // Update map center when selected state changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const { center, zoom } = getMapCenter(selectedState);
    map.current.flyTo({
      center,
      zoom,
      duration: 1000
    });
  }, [selectedState, mapLoaded]);

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
