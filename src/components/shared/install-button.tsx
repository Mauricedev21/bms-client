import { useState } from 'react';
import { Download, Share, PlusSquare, MonitorDown } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useInstallPrompt } from '@/lib/pwa';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * "Install app" button for the PWA. Renders nothing when the app is already
 * installed or the browser offers no install path, so it never clutters the UI.
 * - Android/desktop Chrome & Edge: one-tap native install prompt.
 * - iOS Safari: shows Share → Add to Home Screen instructions.
 */
export function InstallButton() {
  const { t } = useLanguage();
  const { canInstall, hasNativePrompt, isIOS, install } = useInstallPrompt();
  const [showIOS, setShowIOS] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOS(true);
      return;
    }
    if (!hasNativePrompt) {
      toast.info(t('pwa.installMenuHint'));
      return;
    }
    setBusy(true);
    try {
      const outcome = await install();
      if (outcome === 'accepted') toast.success(t('pwa.installSuccess'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => void handleClick()} disabled={busy}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t('pwa.install')}</span>
      </Button>

      <Dialog open={showIOS} onOpenChange={setShowIOS}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {t('pwa.installTitle')}
            </DialogTitle>
            <DialogDescription>{t('pwa.installIosIntro')}</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Share className="h-3.5 w-3.5" />
              </span>
              <span>{t('pwa.installIosStep1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PlusSquare className="h-3.5 w-3.5" />
              </span>
              <span>{t('pwa.installIosStep2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MonitorDown className="h-3.5 w-3.5" />
              </span>
              <span>{t('pwa.installIosStep3')}</span>
            </li>
          </ol>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">{t('common.close')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
