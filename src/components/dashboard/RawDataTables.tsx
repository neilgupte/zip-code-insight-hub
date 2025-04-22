
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablePagination } from "./TablePagination";
import { useState } from "react";
import { TableSkeleton } from "./TableSkeleton";

export const RawDataTables = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const startRange = (page - 1) * itemsPerPage;
  const endRange = startRange + itemsPerPage - 1;

  const { data: divorceRates, isLoading } = useQuery({
    queryKey: ['raw_divorce_rates', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('divorce_rate')
        .select('*')
        .range(startRange, endRange);

      if (error) {
        console.error('Error fetching divorce rates:', error);
        return [];
      }
      return data;
    }
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Raw Divorce Rate Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Zip</TableHead>
                <TableHead>Divorce Rate</TableHead>
                <TableHead>Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={4} />
              ) : divorceRates && divorceRates.length > 0 ? (
                divorceRates.map((rate, index) => (
                  <TableRow key={`${rate.Zip}-${rate.Year}-${index}`}>
                    <TableCell>{rate.State}</TableCell>
                    <TableCell>{rate.Zip}</TableCell>
                    <TableCell>{rate["Divorce Rate"]}</TableCell>
                    <TableCell>{rate.Year}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {divorceRates && divorceRates.length > 0 && (
          <TablePagination
            page={page}
            itemsPerPage={itemsPerPage}
            itemCount={divorceRates.length}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  );
};
