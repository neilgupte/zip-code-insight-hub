
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DataTable = () => {
  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zip</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Households</TableHead>
            <TableHead>Median Divorce Rate</TableHead>
            <TableHead>Composite Score</TableHead>
            <TableHead>Competitors</TableHead>
            <TableHead>TAM</TableHead>
            <TableHead>SAM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations?.map((location) => (
            <TableRow key={location.zip}>
              <TableCell>{location.zip}</TableCell>
              <TableCell>{location.city}</TableCell>
              <TableCell>1,575</TableCell>
              <TableCell>11.0%</TableCell>
              <TableCell>14</TableCell>
              <TableCell>{location.Competitors || 'N/A'}</TableCell>
              <TableCell>$30,250,000</TableCell>
              <TableCell>$5,041,667</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
