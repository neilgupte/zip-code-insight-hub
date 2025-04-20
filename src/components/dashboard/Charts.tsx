
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const divorceData = [
  { year: 2019, rate: 7.8, avgNational: 6.4 },
  { year: 2020, rate: 7.8, avgNational: 6.5 },
  { year: 2021, rate: 8.0, avgNational: 6.5 },
  { year: 2022, rate: 8.0, avgNational: 6.5 },
  { year: 2023, rate: 7.9, avgNational: 6.5 },
  { year: 2024, rate: 7.9, avgNational: 6.5 },
];

export const Charts = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Divorce Rate Florida, All</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={divorceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#8884d8" 
                  name="Avg. Divorce Rate" 
                />
                <Line 
                  type="monotone" 
                  dataKey="avgNational" 
                  stroke="#82ca9d" 
                  name="Avg. National Div" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Households vs Income Level, Florida, All</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* Add the household income chart here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
