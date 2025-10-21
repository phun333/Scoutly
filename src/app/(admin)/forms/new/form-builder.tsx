'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckSquare,
  FileText,
  Hash,
  Link as LinkIcon,
  ListChecks,
  Mail,
  MessageSquareText,
  PlusCircle,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { NativeSelect } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';
import { fieldKey, slugify } from '~/lib/slug';
import { api } from '~/trpc/react';

export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'url' | 'email' | 'number' | 'markdown';

type BuilderField = {
  id: string;
  templateId?: string;
  label: string;
  type: FieldType;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: string[];
};

type EvaluationState = {
  overview: string;
  mustHave: string;
  niceToHave: string;
  customPrompt: string;
};

type InitialFormField = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  helpText?: string | null;
  placeholder?: string | null;
  options?: string[] | null;
  orderIndex: number;
};

type InitialFormPayload = {
  id: string;
  title: string;
  description?: string | null;
  welcomeMessage?: string | null;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  fields: InitialFormField[];
  evaluation?: {
    overview?: string;
    mustHaveKeywords?: string[];
    niceToHaveKeywords?: string[];
    customPrompt?: string;
  } | null;
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const templateFields: BuilderField[] = [
  {
    id: generateId(),
    templateId: 'applicantName',
    label: 'Ad Soyad',
    type: 'text',
    required: true,
    placeholder: 'Ada Lovelace',
  },
  {
    id: generateId(),
    templateId: 'applicantEmail',
    label: 'Email adresi',
    type: 'email',
    required: true,
    placeholder: 'ada@lovelace.dev',
  },
  {
    id: generateId(),
    templateId: 'technologies',
    label: 'Öne çıkan teknolojiler',
    type: 'multiselect',
    required: true,
    helpText: 'Virgül ile ayır: React, Next.js, Prisma',
  },
  {
    id: generateId(),
    templateId: 'motivation',
    label: 'Motivasyon metni',
    type: 'textarea',
    required: true,
    helpText: 'Aday rol için neden uygun olduğunu anlatsın.',
  },
  {
    id: generateId(),
    templateId: 'resumeUrl',
    label: 'CV / Portfolyo linki',
    type: 'url',
    required: false,
    helpText: 'Google Drive, GitHub veya kişisel site linki olabilir.',
  },
  {
    id: generateId(),
    templateId: 'yearsExperience',
    label: 'Profesyonel deneyim (yıl)',
    type: 'number',
    required: true,
  },
];

const reservedTemplateIds = new Set(templateFields.map((field) => field.templateId!));

const blankField = (): BuilderField => ({
  id: generateId(),
  label: 'Yeni alan',
  type: 'text',
  required: false,
});

type FieldTypeMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
};

const toOptionalText = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeOptionList = (entries?: string[] | null): string[] | undefined => {
  if (!entries) {
    return undefined;
  }

  const cleaned = entries
    .map((entry) => entry.trim())
    .filter((entry): entry is string => entry.length > 0);

  return cleaned.length > 0 ? cleaned : undefined;
};

const fieldTypeMeta: Record<FieldType, FieldTypeMeta> = {
  text: {
    label: 'Kısa metin',
    description: 'Örneğin ad soyad, pozisyon veya tek satırlık cevaplar.',
    icon: Type,
  },
  textarea: {
    label: 'Uzun metin',
    description: 'Adayların deneyimlerini veya motivasyonunu anlatması için.',
    icon: MessageSquareText,
  },
  multiselect: {
    label: 'Çoklu seçim',
    description: 'Adayların virgülle ayırarak birden fazla cevabı yazdığı alan.',
    icon: CheckSquare,
  },
  select: {
    label: 'Tek seçim',
    description: 'Listeden yalnızca bir seçenek seçilebilen alan.',
    icon: ListChecks,
  },
  url: {
    label: 'URL',
    description: 'Portfolyo, GitHub veya benzeri linkler için.',
    icon: LinkIcon,
  },
  email: {
    label: 'Email',
    description: 'E-posta formatı kontrolü ile güvenli bilgi toplanır.',
    icon: Mail,
  },
  number: {
    label: 'Sayısal değer',
    description: 'Örneğin deneyim yılı veya puan gibi numerik bilgiler.',
    icon: Hash,
  },
  markdown: {
    label: 'Bilgi bloğu',
    description: 'Adaylara gösterilecek talimat veya açıklama blokları.',
    icon: FileText,
  },
};

const fieldTypeOrder: FieldType[] = ['text', 'textarea', 'multiselect', 'select', 'email', 'url', 'number', 'markdown'];

const fieldTypeOptions = fieldTypeOrder.map((type) => ({
  value: type,
  label: fieldTypeMeta[type].label,
}));

type FieldEditorProps = {
  field: BuilderField;
  index: number;
  errorMessage?: string;
  onUpdate: (patch: Partial<BuilderField>) => void;
  onRemove: () => void;
};

function FieldEditor({ field, index, errorMessage, onUpdate, onRemove }: FieldEditorProps) {
  const [optionDraft, setOptionDraft] = useState('');
  const typeDetails = fieldTypeMeta[field.type];
  const isChoiceField = field.type === 'select';
  const controlErrorClass = errorMessage ? 'border-destructive focus-visible:ring-destructive' : undefined;

  const normalizedOptions = field.options ?? [];

  const handleAddOption = () => {
    const nextValue = optionDraft.trim();
    if (!nextValue) return;
    const hasDuplicate = normalizedOptions.some((item) => item.toLowerCase() === nextValue.toLowerCase());
    if (hasDuplicate) {
      setOptionDraft('');
      return;
    }
    onUpdate({ options: [...normalizedOptions, nextValue] });
    setOptionDraft('');
  };

  return (
    <Card
      className={cn(
        'overflow-hidden border border-border/70 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md',
        errorMessage && 'border-destructive/60 hover:border-destructive/70',
      )}
    >
      <CardHeader className="flex flex-col gap-4 border-b border-border/70 bg-muted/40 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <typeDetails.icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <Badge variant="outline" className="px-2 py-0.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
              Alan {index + 1}
            </Badge>
            <p className="text-base font-semibold text-foreground">{typeDetails.label}</p>
            <p className="text-sm text-muted-foreground">{typeDetails.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={field.required ? 'default' : 'outline'}
            className={cn(
              'px-2 py-1 text-[0.7rem] uppercase tracking-wider',
              errorMessage && 'border-destructive text-destructive',
            )}
          >
            {field.required ? 'Zorunlu' : 'Opsiyonel'}
          </Badge>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" aria-hidden />
            Alanı kaldır
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-2 lg:col-span-2">
            <Label htmlFor={`label-${field.id}`}>Alan başlığı</Label>
            <Input
              id={`label-${field.id}`}
              value={field.label}
              onChange={(event) => onUpdate({ label: event.target.value })}
              className={cn('text-base font-medium', controlErrorClass)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`type-${field.id}`}>Alan tipi</Label>
            <NativeSelect
              id={`type-${field.id}`}
              value={field.type}
              onChange={(event) => {
                const nextType = event.target.value as FieldType;
                onUpdate({
                  type: nextType,
                  ...(nextType === 'select' ? {} : { options: [] }),
                });
              }}
            >
              {fieldTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">{typeDetails.description}</p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.required}
              onChange={(event) => onUpdate({ required: event.target.checked })}
            />
            <div className="space-y-1">
              <Label htmlFor={`required-${field.id}`} className="text-sm font-medium">
                Zorunlu alan
              </Label>
              <p className="text-xs text-muted-foreground">
                Adaylar formu göndermeden önce bu alanı doldurmak zorunda olur.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
            <Input
              id={`placeholder-${field.id}`}
              value={field.placeholder ?? ''}
              onChange={(event) => onUpdate({ placeholder: event.target.value })}
              placeholder="Örn: Pozisyon, Stack, Şirket"
            />
            <p className="text-xs text-muted-foreground">Form boşken gösterilecek örnek metin.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`help-${field.id}`}>Yardım metni</Label>
            <Textarea
              id={`help-${field.id}`}
              value={field.helpText ?? ''}
              onChange={(event) => onUpdate({ helpText: event.target.value })}
              rows={3}
              placeholder="Adaylara bu alanı nasıl dolduracaklarını anlat."
            />
          </div>
        </div>

        {isChoiceField && (
          <div className="space-y-3">
            <Label>Seçenekler</Label>
            <div className="space-y-4 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4">
              {normalizedOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {normalizedOptions.map((option, optionIndex) => (
                    <span
                      key={`${option}-${optionIndex}`}
                      className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm shadow-sm"
                    >
                      {option}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({ options: normalizedOptions.filter((_, idx) => idx !== optionIndex) })
                        }
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">Seçeneği kaldır</span>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Henüz seçenek yok. Aşağıdan tek tek ekleyerek profesyonel bir liste oluştur.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={optionDraft}
                  onChange={(event) => setOptionDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Örn: Remote"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={!optionDraft.trim()}
                  className="sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
                  Seçenek ekle
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                AI değerlendirmesi seçenekleri skorlamada kullanır. Her seçeneği net ve kısa tut.
              </p>
            </div>
          </div>
        )}

        {field.type === 'markdown' && (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            Bu alan yalnızca bilgilendirme içeriği gösterir ve adaydan cevap toplanmaz.
          </div>
        )}

        {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}
      </CardContent>
    </Card>
  );
}

type FormBuilderProps = {
  initialForm?: InitialFormPayload;
};

const defaultEvaluationState: EvaluationState = {
  overview: '',
  mustHave: '',
  niceToHave: '',
  customPrompt: '',
};

export function FormBuilder({ initialForm }: FormBuilderProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const isEditMode = Boolean(initialForm);

  const [title, setTitle] = useState(initialForm?.title ?? 'Frontend Developer Başvurusu');
  const [description, setDescription] = useState(initialForm?.description ?? '');
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialForm?.welcomeMessage ?? 'Deneyimini, teknolojilerini ve gerekli linkleri paylaş. Scoutly başvurunu ön elemeden geçirsin.',
  );
  const [publish, setPublish] = useState(initialForm ? initialForm.status === 'ACTIVE' : true);

  const [fields, setFields] = useState<BuilderField[]>(() => {
    if (!initialForm) {
      return templateFields.slice(0, 4).map((field) => ({ ...field, id: generateId() }));
    }

    return initialForm.fields
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((field) => {
        const template = reservedTemplateIds.has(field.key)
          ? templateFields.find((item) => item.templateId === field.key)
          : undefined;

        let options: string[] | undefined;
        if (Array.isArray(field.options)) {
          options = field.options.filter((item): item is string => typeof item === 'string');
        } else {
          const config = (field as Record<string, unknown>).config as { options?: unknown } | undefined;
          if (Array.isArray(config?.options)) {
            options = config?.options.filter((item): item is string => typeof item === 'string');
          }
        }

        return {
          id: generateId(),
          templateId: template ? template.templateId : undefined,
          label: field.label,
          type: field.type,
          required: field.required,
          helpText: field.helpText ?? undefined,
          placeholder: field.placeholder ?? undefined,
          options,
        } satisfies BuilderField;
      });
  });

  const [evaluation, setEvaluation] = useState<EvaluationState>(() => {
    if (!initialForm?.evaluation) return defaultEvaluationState;
    return {
      overview: initialForm.evaluation.overview ?? '',
      mustHave: (initialForm.evaluation.mustHaveKeywords ?? []).join(', '),
      niceToHave: (initialForm.evaluation.niceToHaveKeywords ?? []).join(', '),
      customPrompt: initialForm.evaluation.customPrompt ?? '',
    };
  });

  const [titleError, setTitleError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = api.form.create.useMutation({
    onSuccess: async (form) => {
      await utils.form.list.invalidate();
      router.push(`/forms/manage/${form.id}`);
    },
    onError: (err) => setFormError(err.message),
  });

  const updateMutation = api.form.update.useMutation({
    onSuccess: async (form) => {
      await Promise.all([
        utils.form.detail.invalidate({ id: form.id }),
        utils.form.list.invalidate(),
        utils.submission.recent.invalidate(),
      ]);
      router.push(`/forms/manage/${form.id}`);
      router.refresh();
    },
    onError: (err) => setFormError(err.message),
  });

  const mutation = isEditMode ? updateMutation : createMutation;

  const updateField = (id: string, patch: Partial<BuilderField>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addCustomField = () => {
    setFields((prev) => [...prev, blankField()]);
  };

  const parseKeywords = (value: string): string[] =>
    value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTitleError(null);
    setFieldErrors({});
    setFormError(null);

    const trimmedTitle = title.trim();
    const nextFieldErrors: Record<string, string> = {};
    let hasError = false;
    let generalError: string | null = null;

    if (!trimmedTitle) {
      setTitleError('Form başlığı zorunludur.');
      generalError = 'Form başlığını doldurmalısın.';
      hasError = true;
    } else if (trimmedTitle.length < 3) {
      setTitleError('Form başlığı en az 3 karakter olmalıdır.');
      generalError = 'Form başlığını biraz daha detaylandırmalısın.';
      hasError = true;
    }

    if (fields.length === 0) {
      generalError = 'En az bir alan eklemelisin.';
      hasError = true;
    }

    const seenKeys = new Map<string, string>();

    for (const field of fields) {
      const trimmedLabel = field.label.trim();
      if (!trimmedLabel) {
        nextFieldErrors[field.id] = 'Alan etiketi zorunlu.';
        hasError = true;
        continue;
      }

      if (trimmedLabel.length < 2) {
        nextFieldErrors[field.id] = 'Alan etiketi en az 2 karakter olmalı.';
        hasError = true;
      }

      const derivedKey = field.templateId ?? fieldKey(trimmedLabel);
      const existingFieldId = seenKeys.get(derivedKey);
      if (existingFieldId && existingFieldId !== field.id) {
        nextFieldErrors[field.id] = 'Bu etiket başka bir alanla çakışıyor.';
        nextFieldErrors[existingFieldId] = 'Bu etiket başka bir alanla çakışıyor.';
        generalError = 'Alan etiketleri benzersiz olmalı.';
        hasError = true;
      } else {
        seenKeys.set(derivedKey, field.id);
      }

      if (field.type === 'select') {
        const options = field.options?.filter(Boolean) ?? [];
        if (options.length === 0) {
          nextFieldErrors[field.id] = 'Bu alan için en az bir seçenek eklemelisin.';
          hasError = true;
          generalError ??= 'Seçilen alanlar için seçenekleri tamamlamalısın.';
        }
      }
    }

    if (hasError) {
      setFieldErrors(nextFieldErrors);
      setFormError(generalError ?? 'Lütfen işaretlenen alanları düzelt ve tekrar dene.');
      return;
    }

    const mustHaveKeywords = parseKeywords(evaluation.mustHave);
    const niceToHaveKeywords = parseKeywords(evaluation.niceToHave);

    const evaluationPayload = {
      overview: toOptionalText(evaluation.overview),
      mustHaveKeywords: mustHaveKeywords.length ? mustHaveKeywords : undefined,
      niceToHaveKeywords: niceToHaveKeywords.length ? niceToHaveKeywords : undefined,
      customPrompt: toOptionalText(evaluation.customPrompt),
    };

    const basePayload = {
      title: trimmedTitle,
      description: toOptionalText(description),
      welcomeMessage: toOptionalText(welcomeMessage),
      publish,
      fields: fields.map(({ id: _id, templateId, label, helpText, placeholder, options, ...rest }) => {
        const normalizedLabel = label.trim();
        const key = templateId ?? fieldKey(normalizedLabel);
        const normalizedOptions = rest.type === 'select' ? normalizeOptionList(options) : undefined;
        return {
          ...rest,
          label: normalizedLabel,
          key,
          helpText: toOptionalText(helpText),
          placeholder: toOptionalText(placeholder),
          options: normalizedOptions,
        };
      }),
      evaluation:
        evaluationPayload.overview || evaluationPayload.mustHaveKeywords?.length || evaluationPayload.niceToHaveKeywords?.length || evaluationPayload.customPrompt
          ? evaluationPayload
          : undefined,
    };

    if (isEditMode) {
      const updatePayload = structuredClone({ ...basePayload, id: initialForm!.id });
      updateMutation.mutate({ json: updatePayload });
    } else {
      const createPayload = structuredClone(basePayload);
      createMutation.mutate({ json: createPayload });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Form bilgileri</CardTitle>
          <CardDescription>Başvurunun adı, açıklaması ve adaylara gösterilecek karşılama metni.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="form-title">Form başlığı</Label>
            <Input
              id="form-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={cn('text-base font-semibold', titleError && 'border-destructive focus-visible:ring-destructive')}
            />
            {titleError && <p className="text-sm text-destructive">{titleError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="form-description">Kısa açıklama</Label>
            <Textarea
              id="form-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Formu birkaç cümle ile özetle."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="form-welcome">Karşılama mesajı</Label>
            <Textarea
              id="form-welcome"
              value={welcomeMessage}
              onChange={(event) => setWelcomeMessage(event.target.value)}
              rows={4}
              placeholder="Adaylara süreci anlatan sıcak bir mesaj yaz."
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-3">
            <Checkbox id="form-publish" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
            <div className="space-y-1">
              <Label htmlFor="form-publish" className="text-sm font-medium">
                Formu yayınla
              </Label>
              <p className="text-xs text-muted-foreground">
                Yayınlanan formlar hemen /forms/{slugify(title || 'form')} adresinde erişilebilir olur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Değerlendirme rehberi</CardTitle>
          <CardDescription>
            Scoutly’nin Gemini değerlendirmesi için hangi sinyalleri arayacağını tanımla. Anahtar kelimeleri virgülle ayır.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="evaluation-overview">Genel beklenti</Label>
            <Textarea
              id="evaluation-overview"
              value={evaluation.overview}
              onChange={(event) => setEvaluation((prev) => ({ ...prev, overview: event.target.value }))}
              rows={3}
              placeholder="Bu rol için adaydan beklediğiniz temel sorumlulukları özetleyin."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evaluation-must">Zorunlu anahtar kelimeler</Label>
            <Textarea
              id="evaluation-must"
              value={evaluation.mustHave}
              onChange={(event) => setEvaluation((prev) => ({ ...prev, mustHave: event.target.value }))}
              rows={2}
              placeholder="Next.js, TypeScript, Liderlik"
            />
            <p className="text-xs text-muted-foreground">Gemini bu kelimeleri form yanıtlarında veya CV’de arayacak.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evaluation-nice">Olması güzel kelimeler</Label>
            <Textarea
              id="evaluation-nice"
              value={evaluation.niceToHave}
              onChange={(event) => setEvaluation((prev) => ({ ...prev, niceToHave: event.target.value }))}
              rows={2}
              placeholder="Unit testing, GraphQL, AWS"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evaluation-custom">Ek talimat</Label>
            <Textarea
              id="evaluation-custom"
              value={evaluation.customPrompt}
              onChange={(event) => setEvaluation((prev) => ({ ...prev, customPrompt: event.target.value }))}
              rows={3}
              placeholder="Örneğin: Proje yönetim tecrübesine özel önem ver."
            />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-card/60 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Alanlar</h2>
            <p className="text-sm text-muted-foreground">
              Adaylardan hangi bilgileri isteyeceğini seç. Şablon alanlarıyla hızlıca başlayabilir veya özel alan ekleyebilirsin.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={addCustomField} className="gap-2">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Özel alan ekle
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              field={field}
              index={index}
              errorMessage={fieldErrors[field.id]}
              onUpdate={(patch) => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
            />
          ))}
        </div>
      </section>

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Form kaydedilemedi</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Formu yayınladıktan sonra dilediğin zaman durumu değiştirebilir, alanları güncelleyebilir veya AI rehberini düzenleyebilirsin.
          </p>
          <Button type="submit" disabled={mutation.isPending} size="lg" className="gap-2">
            {mutation.isPending ? 'Kaydediliyor…' : isEditMode ? 'Formu güncelle' : 'Formu oluştur'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
