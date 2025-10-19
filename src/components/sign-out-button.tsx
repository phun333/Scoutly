'use client';

import { useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { Button, type ButtonProps } from '~/components/ui/button';

type SignOutButtonProps = ButtonProps;

export function SignOutButton({ variant = 'ghost', size, className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: '/' });
    });
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} disabled={isPending}>
      {isPending ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
    </Button>
  );
}
