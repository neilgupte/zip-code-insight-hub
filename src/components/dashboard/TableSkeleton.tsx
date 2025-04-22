
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
}

export const TableSkeleton = ({ columns }: TableSkeletonProps) => {
  return Array(5).fill(0).map((_, index) => (
    <TableRow key={`skeleton-${index}`}>
      {Array(columns).fill(0).map((_, colIndex) => (
        <TableCell key={`skeleton-cell-${index}-${colIndex}`}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
};
