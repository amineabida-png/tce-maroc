import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LogoFieldProps {
  value: string;
  onChange: (dataUri: string) => void;
  editable: boolean;
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LogoField({ value, onChange, editable }: LogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUri = await readAsDataUri(file);
    onChange(dataUri);
  }

  return (
    <div className="space-y-1.5">
      <Label>Logo</Label>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {value ? (
            <img src={value} alt="Logo de la société" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Aucun</span>
          )}
        </div>
        {editable && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              {value ? 'Changer' : 'Importer'}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange('')}>
                Retirer
              </Button>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}
      </div>
    </div>
  );
}
