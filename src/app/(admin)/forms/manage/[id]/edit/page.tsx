import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { FormBuilder } from '~/app/(admin)/forms/new/form-builder';
import type { FieldType } from '~/app/(admin)/forms/new/form-builder';
import { ensureStringArray, isJsonObject } from '~/lib/json-guards';
import { createServerCaller } from '~/trpc/server';

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();

  try {
    const form = await caller.form.detail({ id });

    const evaluation = (() => {
      if (!isJsonObject(form.config)) return undefined;
      const evalConfig = isJsonObject(form.config.evaluation) ? form.config.evaluation : undefined;
      if (!evalConfig) return undefined;
      return {
        overview: typeof evalConfig.overview === 'string' ? evalConfig.overview : undefined,
        mustHaveKeywords: ensureStringArray(evalConfig.mustHaveKeywords),
        niceToHaveKeywords: ensureStringArray(evalConfig.niceToHaveKeywords),
        customPrompt: typeof evalConfig.customPrompt === 'string' ? evalConfig.customPrompt : undefined,
      };
    })();

    const initialForm = {
      id: form.id,
      title: form.title,
      description: form.description,
      welcomeMessage: form.welcomeMessage,
      status: form.status,
      fields: form.fields.map((field) => {
        const rawOptions = isJsonObject(field.config) ? field.config.options : undefined;
        const options = Array.isArray(rawOptions)
          ? rawOptions.filter((item): item is string => typeof item === 'string')
          : typeof rawOptions === 'string'
            ? rawOptions
                .split(',')
                .map((item) => item.trim())
                .filter((item): item is string => item.length > 0)
            : undefined;
        return {
          id: field.id,
          key: field.key,
          label: field.label,
          type: field.type as FieldType,
          required: field.required,
          helpText: field.helpText,
          placeholder: field.placeholder,
          options,
          orderIndex: field.orderIndex,
        };
      }),
      evaluation,
    };

    return (
      <main className="flex flex-1 flex-col gap-8 pb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Formu düzenle</h1>
            <p className="text-muted-foreground">
              Alanları ve değerlendirme rehberini güncelle; değişiklikler aktif formuna uygulanır.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href={`/forms/manage/${form.id}`}>Form detayına dön</Link>
          </Button>
        </div>
        <FormBuilder initialForm={initialForm} />
      </main>
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
