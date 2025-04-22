
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IncomeRow {
  Zip: number;
  Income_bracket: number;
  State: string;
  Households: number;
}

export const RawIncomeData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["raw_income_data"],
    queryFn: async () => {
      console.log("Fetching raw income data");
      
      const { data: incomeData, error } = await supabase
        .from("income")
        .select("*")
        .limit(100);
      
      if (error) {
        console.error("Error fetching raw income data:", error);
        throw error;
      }
      
      console.log("Raw income data response:", {
        rows: incomeData?.length,
        firstRow: incomeData?.[0]
      });
      
      return incomeData as IncomeRow[];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Income Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Income Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading raw income data: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Income Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No income data found. Please check the console logs for more information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Income Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zip</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Income Bracket</TableHead>
                <TableHead>Households</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={`${row.Zip}-${row.Income_bracket}-${index}`}>
                  <TableCell>{row.Zip}</TableCell>
                  <TableCell>{row.State}</TableCell>
                  <TableCell>${row.Income_bracket?.toLocaleString()}</TableCell>
                  <TableCell>{row.Households?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
