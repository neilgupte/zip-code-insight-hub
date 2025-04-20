
export const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3BpcmF0ZWNoIiwiYSI6ImNtOXBzbXI0eTFjdHoya3IwNng1ZTI4ZHoifQ.hgWIXnSx6HdRC67U2xhdxQ';

export const MAP_STYLES = {
  circleRadius: [
    'interpolate', ['linear'], ['get', 'composite_score'],
    1, 5,   // Min score
    20, 15  // Max score
  ],
  circleColor: [
    'interpolate', ['linear'], ['get', 'composite_score'],
    1, '#f2fcE2',  // Low score (soft green)
    10, '#9b87f5', // Medium score (purple)
    20, '#8B5CF6'  // High score (vivid purple)
  ],
};

export const getMapCenter = (selectedState: string) => ({
  center: selectedState === 'florida' ? [-82.5, 28.0] : [-98.5, 39.8],
  zoom: selectedState === 'florida' ? 6 : 4,
});
