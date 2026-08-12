import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ArticleFormValues } from './api';
import type { Article } from './types';

const EMPTY: ArticleFormValues = { nom: '', categorie: '', unite: '', seuilAlerte: '' };

function toFormValues(a: Article | null): ArticleFormValues {
  if (!a) return EMPTY;
  return { nom: a.nom, categorie: a.categorie ?? '', unite: a.unite, seuilAlerte: a.seuilAlerte ?? '' };
}

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: Article | null;
  onSubmit: (values: ArticleFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function ArticleFormDialog({ open, onOpenChange, article, onSubmit, submitting, error }: ArticleFormDialogProps) {
  const [values, setValues] = useState<ArticleFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(article));
  }, [open, article]);

  function set<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{article ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
          <DialogDescription>Matériau suivi en stock.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" required value={values.nom} onChange={(e) => set('nom', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="categorie">Catégorie</Label>
              <Input id="categorie" value={values.categorie} onChange={(e) => set('categorie', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unite">Unité *</Label>
              <Input id="unite" required value={values.unite} onChange={(e) => set('unite', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seuil">Seuil d'alerte</Label>
            <Input
              id="seuil"
              type="number"
              min="0"
              step="0.01"
              value={values.seuilAlerte}
              onChange={(e) => set('seuilAlerte', e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
