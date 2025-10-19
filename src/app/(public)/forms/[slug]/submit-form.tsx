'use client';

import { useMemo, useState } from 'react';
import type { Form, FormField } from '@prisma/client';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { NativeSelect } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/trpc/react';

type FormWithFields = Form & { fields: FormField[] };

type SubmissionResult = {
  submissionId: string;
  message: string;
};

const applicantNameKeys = new Set(['applicantName', 'ad_soyad']);
const applicantEmailKeys = new Set(['applicantEmail', 'email_adresi']);
const resumeUrlKeys = new Set(['resumeUrl', 'cv_portfolyo_linki']);

function getOptions(field: FormField): string[] {
  const config = field.config as null | { options?: unknown };
  if (config && Array.isArray(config.options)) {
    return config.options.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function ApplicantForm({ form }: { form: FormWithFields }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of form.fields) {
      initial[field.key] = '';
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const mutation = api.submission.publicSubmit.useMutation({
    onSuccess: (result) => {
      const payload = ('json' in result ? result.json : result) as SubmissionResult;
      setResult(payload);
      setError(null);
      setResumeFile(null);
    },
    onError: (err) => {
      if (err.message === 'Unable to transform response from server') {
        setError('Başvuru gönderilirken sunucudan beklenmeyen bir cevap geldi. Lütfen biraz sonra tekrar dene.');
        return;
      }
      setError(err.message);
    },
  });

  const sortedFields = useMemo(
    () => [...form.fields].sort((a, b) => a.orderIndex - b.orderIndex),
    [form.fields],
  );

  const handleChange = (key: string, value: string) => {
    setResult(null);
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const rest = { ...prev };
      delete rest[key];
      if (Object.keys(rest).length === 0) {
        setError(null);
      }
      return rest;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let applicantName = '';
    let applicantEmail: string | undefined;
    let resumeUrl: string | undefined;
    const answers: Record<string, string | number | boolean | string[] | null> = {};
    const nextFieldErrors: Record<string, string> = {};

    for (const field of sortedFields) {
      const rawValue = values[field.key]?.trim();

      if (field.required && !rawValue) {
        nextFieldErrors[field.key] = `${field.label} alanı zorunludur.`;
        continue;
      }

      if (!rawValue) {
        continue;
      }

      let processed: unknown = rawValue;

      if (field.type === 'multiselect') {
        processed = rawValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (field.type === 'number') {
        const parsed = Number(rawValue);
        if (Number.isNaN(parsed)) {
          nextFieldErrors[field.key] = `${field.label} sayısal olmalıdır.`;
          continue;
        }
        processed = parsed;
      }

      if (applicantNameKeys.has(field.key) && typeof processed === 'string') {
        applicantName = processed;
        continue;
      }

      if (applicantEmailKeys.has(field.key) && typeof processed === 'string') {
        applicantEmail = processed;
        continue;
      }

      if (resumeUrlKeys.has(field.key) && typeof processed === 'string') {
        resumeUrl = processed;
        continue;
      }

      answers[field.key] = processed as string | number | boolean | string[];
    }

    if (!applicantName) {
      const applicantNameField = sortedFields.find((field) => applicantNameKeys.has(field.key));
      if (applicantNameField) {
        nextFieldErrors[applicantNameField.key] = `${applicantNameField.label} alanı zorunludur.`;
      } else {
        nextFieldErrors.applicantName = 'Ad Soyad zorunludur.';
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('Lütfen işaretlenen alanları doldur.');
      return;
    }

    setFieldErrors({});
    setError(null);

    let resumeFilePayload: { name: string; type: string; base64: string } | undefined;
    if (resumeFile) {
      if (resumeFile.type !== 'application/pdf') {
        setError('Lütfen PDF formatında bir dosya yükle.');
        return;
      }

      resumeFilePayload = await new Promise<{ name: string; type: string; base64: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            const base64 = result.split(',')[1] ?? '';
            resolve({ name: resumeFile.name, type: resumeFile.type, base64 });
          } else {
            reject(new Error('Dosya okunamadı'));
          }
        };
        reader.onerror = () => reject(reader.error ?? new Error('Dosya okunurken hata oluştu'));
        reader.readAsDataURL(resumeFile);
      });
    }

    mutation.mutate({
      formSlug: form.slug,
      applicantName,
      applicantEmail,
      resumeUrl,
      resumeFile: resumeFilePayload,
      answers,
    });
  };

  if (result) {
    return (
      <Card className="border-dashed border-primary/40">
        <CardHeader>
          <CardTitle>Başvurun ulaştı!</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Scoutly ekibi başvurunu aldı. Değerlendirme sonuçları hazır olduğunda ekibimiz sana dönüş
            yapacak. Bu sırada e-posta kutunu takipte kal.
          </p>
          <p className="text-xs">
            Başvurunu güncellemek istersen aynı bağlantıyı kullanarak yeni bir başvuru gönderebilirsin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
        {sortedFields.map((field) => {
        if (field.type === 'markdown') {
          return (
            <Card key={field.id} className="border-dashed bg-secondary/40">
              <CardHeader className="py-4">
                <CardTitle className="text-base">{field.label}</CardTitle>
                <CardDescription>{field.helpText ?? field.placeholder}</CardDescription>
              </CardHeader>
            </Card>
          );
        }

        const options = getOptions(field);
        const value = values[field.key] ?? '';
        const fieldError = fieldErrors[field.key];
        const controlErrorClass = fieldError ? 'border-destructive focus-visible:ring-destructive' : undefined;

        return (
          <div key={field.id} className="grid gap-2">
            <Label htmlFor={field.id} className="flex items-center gap-1 text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            {(() => {
              switch (field.type) {
                case 'textarea':
                  return (
                    <Textarea
                      id={field.id}
                      rows={4}
                      value={value}
                      placeholder={field.placeholder ?? ''}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      className={controlErrorClass}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `${field.id}-error` : undefined}
                    />
                  );
                case 'multiselect':
                  return (
                    <Textarea
                      id={field.id}
                      rows={3}
                      value={value}
                      placeholder={field.placeholder ?? 'Örnek: React, Next.js, Tailwind'}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      className={controlErrorClass}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `${field.id}-error` : undefined}
                    />
                  );
                case 'select':
                  return (
                    <NativeSelect
                      id={field.id}
                      value={value}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      required={field.required}
                      className={controlErrorClass}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `${field.id}-error` : undefined}
                    >
                      <option value="">Bir seçenek seç</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </NativeSelect>
                  );
                default:
                  return (
                    <Input
                      id={field.id}
                      type={
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'email'
                            ? 'email'
                            : field.type === 'url'
                              ? 'url'
                              : 'text'
                      }
                      value={value}
                      placeholder={field.placeholder ?? ''}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      className={controlErrorClass}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `${field.id}-error` : undefined}
                    />
                  );
              }
            })()}
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {fieldError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {fieldError}
              </p>
            )}
          </div>
        );
      })}

      <div className="grid gap-2">
        <Label htmlFor="resume-file" className="flex items-center gap-1 text-sm font-medium text-foreground">
          CV dosyası (PDF)
        </Label>
        <Input
          id="resume-file"
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setResumeFile(file);
          }}
        />
        <p className="text-xs text-muted-foreground">
          PDF yüklediğinde Gemini CV içerğini de tarayarak değerlendirmeye dahil eder.
        </p>
        {resumeFile && (
          <p className="text-xs text-muted-foreground">Seçilen dosya: {resumeFile.name}</p>
        )}
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" disabled={mutation.isPending} className="justify-self-start">
        {mutation.isPending ? 'Gönderiliyor…' : 'Başvuruyu gönder'}
      </Button>
    </form>
  );
}
