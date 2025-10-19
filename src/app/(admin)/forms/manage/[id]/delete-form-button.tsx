'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

interface DeleteFormButtonProps {
  formId: string;
  formTitle: string;
  redirectTo?: string;
  layout?: 'inline' | 'block';
  size?: 'default' | 'sm';
  className?: string;
}

export function DeleteFormButton({
  formId,
  formTitle,
  redirectTo,
  layout = 'block',
  size = 'default',
  className,
}: DeleteFormButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const mutation = api.form.delete.useMutation({
    onSuccess: async () => {
      setError(null);
      setConfirming(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleDelete = () => {
    if (mutation.isPending) return;
    mutation.mutate({ json: { id: formId } });
  };

  return (
    <div
      className={cn(
        layout === 'inline' ? 'flex items-center gap-3' : 'flex flex-col gap-2',
        className,
      )}
    >
      {!confirming ? (
        <Button
          type="button"
          variant="destructive"
          size={size}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          disabled={mutation.isPending}
        >
          Formu sil
        </Button>
      ) : (
        <div className={cn('flex gap-2', layout === 'inline' && 'items-center')}>
          <Button
            type="button"
            variant="destructive"
            size={size}
            onClick={handleDelete}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Siliniyor…' : 'Evet, sil'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          onClick={() => {
              if (!mutation.isPending) {
                setConfirming(false);
                setError(null);
              }
            }}
            disabled={mutation.isPending}
          >
            Vazgeç
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {layout === 'block' && confirming && !mutation.isPending && (
        <p className="text-xs text-muted-foreground">
          &quot;{formTitle}&quot; formunu ve tüm başvuruları kalıcı olarak sileceksin.
        </p>
      )}
    </div>
  );
}
