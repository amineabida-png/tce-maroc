import { Button } from '@/components/ui/button';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ page, totalPages, total, onPageChange }: PaginationBarProps) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
      <span>
        {total} résultat{total > 1 ? 's' : ''} — page {page}/{totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Précédent
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
