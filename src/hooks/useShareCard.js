import { useActiveData } from '../store/attendanceStore.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import { adviceSentence, summarize } from '../utils/attendance.js';
import { shareAttendanceCard } from '../utils/shareCard.js';

/** Returns a function that shares (or downloads) the "My attendance" image. */
export function useShareCard() {
  const profile = useAuthStore((s) => s.profile);
  const data = useActiveData();
  return async () => {
    if (!data) return;
    const s = summarize(data.overall.present, data.overall.total);
    try {
      const result = await shareAttendanceCard({
        firstName: profile?.firstName,
        percentage: data.overall.percentage,
        status: s.status,
        advice: adviceSentence(s),
      });
      if (result === 'downloaded') toast({ title: 'Image saved', description: 'Your attendance card was downloaded.', tone: 'success' });
    } catch {
      toast({ title: "Couldn't create the image", tone: 'error' });
    }
  };
}
