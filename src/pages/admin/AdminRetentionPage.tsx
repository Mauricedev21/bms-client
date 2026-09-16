import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Archive, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import { PageHeader, SectionCard } from '@/components/shared/cards';
import { ConfirmDialog } from '@/components/shared/dialogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminRetentionPage() {
  const { t } = useLanguage();
  const [months, setMonths] = useState('6');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ archived: number; skippedActiveLoans?: number } | null>(null);

  const run = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/retention/run', { months: Number(months) });
      return res.data.data as { archived: number; skippedActiveLoans?: number };
    },
    onSuccess: (d) => {
      setResult(d);
      toast.success(t('admin.retentionDone'));
      setConfirmOpen(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader title={t('nav.adminRetention')} description={t('admin.retentionSubtitle')} icon={Archive} />

      <SectionCard title={t('admin.retentionTitle')} description={t('admin.retentionHint')} icon={Archive} className="max-w-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.retentionMonths')}</Label>
            <Input inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ''))} />
            <p className="text-xs text-muted-foreground">{t('admin.retentionMonthsHint')}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            <ShieldAlert className="mb-1 h-4 w-4" />
            {t('admin.retentionWarning')}
          </div>
          <Button onClick={() => setConfirmOpen(true)} disabled={run.isPending}>
            <Archive className="mr-2 h-4 w-4" />
            {run.isPending ? t('common.loading') : t('admin.runRetention')}
          </Button>

          {result ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{t('admin.retentionResult')}</p>
              <p className="mt-1 text-muted-foreground">
                {t('admin.retentionArchived')}: <b>{result.archived}</b>
                {result.skippedActiveLoans !== undefined ? (
                  <span> · {t('admin.retentionSkipped')}: <b>{result.skippedActiveLoans}</b></span>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('admin.retentionConfirm')}
        description={<>{t('admin.retentionConfirmHint')} <b>{months}</b> {t('admin.monthsLower')}.</>}
        confirmLabel={run.isPending ? t('common.loading') : t('admin.confirmRun')}
        variant="default"
        loading={run.isPending}
        onConfirm={() => run.mutate()}
      />
    </div>
  );
}