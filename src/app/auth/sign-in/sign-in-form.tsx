'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

type SignInFormProps = {
  callbackUrl?: string;
  error?: string;
};

export function SignInForm({ callbackUrl, error }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !accessCode) {
      setFormError('Email ve erişim kodu gerekli.');
      return;
    }

    startTransition(async () => {
      setFormError(null);
      const response = await signIn('credentials', {
        email,
        accessCode,
        redirect: true,
        callbackUrl: callbackUrl ?? '/dashboard',
      });

      if (response?.error) {
        setFormError('Giriş başarısız. Bilgilerini kontrol et.');
      }
    });
  };

  const displayError = formError ?? (error ? 'Giriş başarısız. Tekrar dene.' : null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Admin girişi</CardTitle>
        <CardDescription>İlan oluşturmak ve başvuruları görmek için giriş yap.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accessCode">Erişim Kodu</Label>
            <Input
              id="accessCode"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              required
            />
          </div>
          {displayError && <p className="text-sm font-medium text-destructive">{displayError}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Giriş yapılıyor…' : 'Panele git'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
