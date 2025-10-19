import type { Metadata } from 'next';
import { FormBuilder } from './form-builder';

export const metadata: Metadata = {
  title: 'Create Form',
};

export default function NewFormPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Yeni ilan formu oluştur</h1>
        <p className="text-muted-foreground">
          Adaylardan hangi bilgileri toplayacağını belirle, Scoutly senin için başvuruları skorlasın.
        </p>
      </div>
      <FormBuilder />
    </main>
  );
}
