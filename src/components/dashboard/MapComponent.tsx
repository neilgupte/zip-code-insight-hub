
import React, { useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useLocationData } from './map/useLocationData';
import { Legend } from './map/Legend';
import { useMapInitialization } from './map/useMapInitialization';
import { useLocationMarkers } from './map/useLocationMarkers';
import { useStateBoundary } from './map/useStateBoundary';

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

  useMapInitialization(mapContainer, map, selectedState, setMapLoaded);
  useLocationMarkers(map, mapLoaded, locations, selectedState);
  useStateBoundary(map, mapLoaded, selectedState);

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

