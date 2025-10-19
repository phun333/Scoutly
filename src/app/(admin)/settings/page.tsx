import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profil ayarları</h1>
        <p className="text-sm text-muted-foreground">Ekip içinde paylaşılacak temel bilgileri güncelle.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Profili düzenle</CardTitle>
          <CardDescription>Şimdilik yalnızca ad ve şablon e-posta alanları bulunuyor.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Ad Soyad</Label>
            <Input id="profile-name" placeholder="Ada Lovelace" disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">E-posta</Label>
            <Input id="profile-email" type="email" placeholder="ada@scoutly.ai" disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-title">Başlık</Label>
            <Input id="profile-title" placeholder="Teknik işe alım lideri" disabled />
          </div>
          <Button type="button" disabled>
            Yakında düzenlenebilir
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
