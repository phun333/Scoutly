![Scoutly Banner](./public/scouty_banner.png)


Scoutly, işe alım ekiplerinin başvuruları saniyeler içinde ön değerlendirmeye tabi tutmasını sağlayan yapay zekâ destekli bir aday eleme platformudur. Form yanıtlarını ve CV içeriklerini birlikte analiz ederek teknik uyum, iletişim becerisi ve motivasyon sinyallerini tek bir panelde toplar.

## İçindekiler
- [Öne Çıkan Özellikler](#öne-çıkan-özellikler)
- [Mimari ve Teknolojiler](#mimari-ve-teknolojiler)
- [Kurulum](#kurulum)
- [Geliştirme Akışı](#geliştirme-akışı)
- [Veritabanı İşlemleri](#veritabanı-işlemleri)
- [Proje Yapısı](#proje-yapısı)
- [Katkıda Bulunma](#katkıda-bulunma)

## Öne Çıkan Özellikler
- Yapay zekâ destekli başvuru skorlaması, güçlü yön ve risk tespiti.
- Admin panelinde gerçek zamanlı başvuru takibi, filtreleme ve detaylı raporlar.
- Paylaşılabilir, markalı başvuru formları ile aday deneyimini sadeleştirme.
- Prisma + PostgreSQL altyapısıyla güçlü veri modeli ve tRPC ile tip güvenli API.
- NextAuth tabanlı oturum yönetimi ve rol kontrollü erişim.

## Mimari ve Teknolojiler
- **Next.js App Router**: Sunucu bileşenleriyle derlenmiş UI ve rotalar.
- **tRPC + React Query**: Tip uçtan uca doğrulanan prosedürler ve veri önbelleği.
- **Prisma ORM**: PostgreSQL şeması, migrasyonlar ve tip üretimi.
- **Tailwind CSS & shadcn/ui**: Tutarlı tasarım sistemi ve yeniden kullanılabilir UI bileşenleri.
- **Google Generative AI**: Başvurular için anlamlandırılmış özetler ve skorlar.

## Kurulum
1. Bu depoyu fork'layın veya klonlayın.
2. Gerekli paketleri yükleyin:
   ```bash
   pnpm install
   ```
3. Ortam değişkenlerini ayarlayın:
   - `.env.example` dosyasını `.env` olarak kopyalayın.
   - `DATABASE_URL`, `AUTH_SECRET` ve entegrasyon anahtarlarını doldurun.
4. İlk çalıştırmada Prisma istemcisini oluşturmak için postinstall betiği otomatik devreye girer; gerekirse `pnpm db:generate` komutuyla tekrar çalıştırabilirsiniz.

## Geliştirme Akışı
- Geliştirme sunucusunu başlatmak için:
  ```bash
  pnpm dev
  ```
- Üretim derlemesi:
  ```bash
  pnpm build
  pnpm preview
  ```
- Kod kalitesi ve tip güvenliği:
  ```bash
  pnpm lint
  pnpm typecheck
  pnpm format:write
  ```

## Veritabanı İşlemleri
- Lokal PostgreSQL’i `./start-database.sh` ile başlatın.
- Şema değişikliklerini doğrulamak için:
  ```bash
  pnpm db:push      # Lokal geliştirme için
  pnpm db:migrate   # Üretim senaryoları için migrasyon uygulama
  pnpm db:studio    # Prisma Studio ile verileri inceleme
  ```

## Proje Yapısı
- `src/app`: App Router rotaları, sayfalar ve layout bileşenleri.
- `src/server`: Sunucu tarafı mantığı, tRPC router’ları ve NextAuth yapılandırması.
- `src/lib`: Paylaşılan yardımcılar, türler ve yardımcı fonksiyonlar.
- `prisma`: `schema.prisma`, migrasyonlar ve tohumlama betikleri.
- `public`: Logolar, banner ve statik varlıklar.

## Katkıda Bulunma
Katkılar memnuniyetle karşılanır! Bir öneriniz veya düzeltmeniz varsa:
- Issue açarak problemi veya geliştirme fikrinizi paylaşın.
- Fork alıp değişikliklerinizi yapın, testleri çalıştırın (`pnpm check`), ardından bir pull request gönderin.

Scoutly’ye katkı sağlayan herkese teşekkürler. Birlikte işe alım süreçlerini daha adil ve hızlı hâle getirebiliriz.
