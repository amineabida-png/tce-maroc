import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { updateApparence } from '@/features/auth/api';
import { applyUserTheme } from '@/lib/theme';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const DEFAUT_PRIMAIRE = '#1e3a66';
const DEFAUT_ACCENT = '#dc7a25';

export function ApparenceSection() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [primaire, setPrimaire] = useState(user?.couleurPrimaire || DEFAUT_PRIMAIRE);
  const [accent, setAccent] = useState(user?.couleurAccent || DEFAUT_ACCENT);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (values: { couleurPrimaire: string | null; couleurAccent: string | null }) =>
      updateApparence(values.couleurPrimaire, values.couleurAccent),
    onSuccess: (data) => {
      updateUser({ couleurPrimaire: data.couleurPrimaire, couleurAccent: data.couleurAccent });
      setSaved(true);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  function previewer(setter: (v: string) => void, other: string, mode: 'primaire' | 'accent') {
    return (value: string) => {
      setter(value);
      setSaved(false);
      if (mode === 'primaire') applyUserTheme(value, other);
      else applyUserTheme(other, value);
    };
  }
  const onPrimaireChange = previewer(setPrimaire, accent, 'primaire');
  const onAccentChange = previewer(setAccent, primaire, 'accent');

  function reinitialiser() {
    setPrimaire(DEFAUT_PRIMAIRE);
    setAccent(DEFAUT_ACCENT);
    setSaved(false);
    applyUserTheme(null, null);
    saveMutation.mutate({ couleurPrimaire: null, couleurAccent: null });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apparence</CardTitle>
        <p className="text-sm text-muted-foreground">
          Charte de couleurs propre à votre compte — n'affecte pas l'affichage des autres utilisateurs, ni les
          documents imprimés.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="couleur-primaire">Couleur principale</Label>
            <div className="flex items-center gap-2">
              <input
                id="couleur-primaire"
                type="color"
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                value={primaire}
                onChange={(e) => onPrimaireChange(e.target.value)}
              />
              <span className="font-mono text-sm text-muted-foreground">{primaire}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="couleur-accent">Couleur d'accent</Label>
            <div className="flex items-center gap-2">
              <input
                id="couleur-accent"
                type="color"
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                value={accent}
                onChange={(e) => onAccentChange(e.target.value)}
              />
              <span className="font-mono text-sm text-muted-foreground">{accent}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => saveMutation.mutate({ couleurPrimaire: primaire, couleurAccent: accent })}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={reinitialiser}>
            <RotateCcw className="h-3.5 w-3.5" />
            Couleurs par défaut
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Enregistré
            </span>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
