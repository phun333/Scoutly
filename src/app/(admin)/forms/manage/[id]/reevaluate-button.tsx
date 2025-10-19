'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/react';

interface ReevaluateButtonProps {
  formId: string;
}

export function ReevaluateButton({ formId }: ReevaluateButtonProps) {
  const utils = api.useUtils();
  const [message, setMessage] = useState<string | null>(null);

  const mutation = api.submission.reevaluateAll.useMutation({
    onSuccess: async (data) => {
      setMessage(`${data.updatedCount} başvuru yeniden değerlendirildi.`);
      await Promise.all([
        utils.form.detail.invalidate({ id: formId }),
        utils.submission.byForm.invalidate({ formId }),
        utils.submission.recent.invalidate(),
      ]);
    },
    onError: (err) => {
      setMessage(err.message);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => mutation.mutate({ formId })}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Yeniden değerlendiriliyor…' : 'Başvuruları yeniden değerlendir'}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
