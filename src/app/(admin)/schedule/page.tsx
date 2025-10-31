import type { Metadata } from 'next';
import { ScheduleClient } from './schedule-client';

export const metadata: Metadata = {
  title: 'Görüşme Planı',
  description: 'Adaylarla planlanan görüşmeleri Google Meet ve yüz yüze olarak filtrele.',
};

export default function SchedulePage() {
  return <ScheduleClient />;
}
