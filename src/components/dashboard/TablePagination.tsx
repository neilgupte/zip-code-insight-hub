
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface TablePaginationProps {
  page: number;
  itemsPerPage: number;
  itemCount: number;
  onPageChange: (newPage: number) => void;
}

export const TablePagination = ({ 
  page, 
  itemsPerPage, 
  itemCount, 
  onPageChange 
}: TablePaginationProps) => {
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }} 
            className={page <= 1 ? "opacity-50 pointer-events-none" : ""}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>{page}</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (itemCount === itemsPerPage) onPageChange(page + 1);
            }} 
            className={itemCount < itemsPerPage ? "opacity-50 pointer-events-none" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
