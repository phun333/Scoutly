'use client';

import type { ChangeEvent } from 'react';
import { useState, useTransition } from 'react';
import type { FormStatus } from '@prisma/client';
import { Badge } from '~/components/ui/badge';
import { NativeSelect } from '~/components/ui/select';
import { api } from '~/trpc/react';

const statuses: Array<{ label: string; value: FormStatus; badge: 'default' | 'secondary' | 'outline' }> = [
  { label: 'Taslak', value: 'DRAFT', badge: 'secondary' },
  { label: 'Aktif', value: 'ACTIVE', badge: 'default' },
  { label: 'Arşiv', value: 'ARCHIVED', badge: 'outline' },
];

export function StatusToggle({ formId, status }: { formId: string; status: FormStatus }) {
  const [current, setCurrent] = useState(status);
  const utils = api.useUtils();
  const [pending, startTransition] = useTransition();

  const mutation = api.form.updateStatus.useMutation({
    onSuccess: async (data) => {
      setCurrent(data.status);
      await utils.form.detail.invalidate({ id: formId });
      await utils.form.list.invalidate();
    },
  });

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value as FormStatus;
    startTransition(() => {
      mutation.mutate({ id: formId, status: nextStatus });
    });
  };

  const statusConfig = statuses.find((option) => option.value === current) ?? statuses[0]!;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/80 bg-background/80 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Form durumu</p>
        <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
      </div>
      <div className="grid gap-2 sm:flex sm:items-center sm:gap-3">
        <NativeSelect
          value={current}
          onChange={handleChange}
          disabled={pending || mutation.isPending}
          className="sm:max-w-[180px]"
        >
          {statuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      {(pending || mutation.isPending) && (
        <p className="text-xs text-muted-foreground">Durum güncelleniyor…</p>
      )}
    </div>
  );
}
