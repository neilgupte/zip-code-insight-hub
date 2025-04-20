
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const TableSkeleton = () => {
  return Array(5).fill(0).map((_, index) => (
    <TableRow key={`skeleton-${index}`}>
      <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
    </TableRow>
  ));
};
