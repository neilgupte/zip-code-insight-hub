
import { useState } from 'react';
import { useLocationInsights } from '@/hooks/useLocationInsights';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TableHeader 
} from '../ui/table';
import { TablePagination } from './TablePagination';
import { TableSkeleton } from './TableSkeleton';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { LocationInsight } from '@/types/location';

interface DataTableProps {
  selectedState: string;
  selectedIncomeBracket: string;
  selectedCompositeScores: string[];
}

type SortConfig = {
  key: keyof LocationInsight | null;
  direction: 'asc' | 'desc';
};

export const DataTable = ({ selectedState, selectedIncomeBracket, selectedCompositeScores }: DataTableProps) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 7; // Set to show 7 rows
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const { data: insights, isLoading } = useLocationInsights(
    selectedState,
    page,
    itemsPerPage,
    selectedIncomeBracket,
    selectedCompositeScores
  );

  const handleSort = (key: keyof LocationInsight) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = insights ? [...insights].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle string comparison
    const aString = String(aValue || '');
    const bString = String(bValue || '');
    return sortConfig.direction === 'asc' 
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  }) : [];

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">ZIP</TableHead>
              <TableHead className="text-xs">City</TableHead>
              <TableHead className="text-xs">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('households')}
                  className="p-0 h-auto font-medium"
                >
                  Households
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-xs">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('Competitors')}
                  className="p-0 h-auto font-medium"
                >
                  Competitors
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-xs">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('composite_score')}
                  className="p-0 h-auto font-medium"
                >
                  Composite Score
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-xs">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('tam')}
                  className="p-0 h-auto font-medium"
                >
                  TAM
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-xs">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('sam')}
                  className="p-0 h-auto font-medium"
                >
                  SAM
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} />
            ) : sortedData && sortedData.length > 0 ? (
              sortedData.map((insight, index) => (
                <TableRow key={`${insight.zip}-${index}`}>
                  <TableCell className="text-xs">{insight.zip}</TableCell>
                  <TableCell className="text-xs">{insight.city}</TableCell>
                  <TableCell className="text-xs">{insight.households?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{insight.Competitors || 'None'}</TableCell>
                  <TableCell className="text-xs">{insight.composite_score?.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">${insight.tam?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">${insight.sam?.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-xs">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {insights && insights.length > 0 && (
        <TablePagination
          page={page}
          itemsPerPage={itemsPerPage}
          itemCount={insights.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
