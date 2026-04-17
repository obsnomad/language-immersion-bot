import type { ProgressSummary } from '@/shared/api';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import { MetricCard } from '@/shared/ui/metric-card/MetricCard';
import { Grid, Stack, Typography } from '@mui/material';

interface ProgressSnapshotSectionProps {
  summary: ProgressSummary;
}

export const ProgressSnapshotSection = ({ summary }: ProgressSnapshotSectionProps) => {
  const { t } = useAppI18n();

  return (
    <Stack component="div" spacing={2} sx={{ mb: 3 }}>
      <div>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t('overview.section')}
        </Typography>
        <Typography variant="h4">{t('overview.title')}</Typography>
      </div>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label={t('overview.sessions')} value={summary.sessions_total} tone="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label={t('overview.openMistakes')}
            value={summary.open_mistakes}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label={t('overview.dueToday')} value={summary.review_due_now} tone="success" />
        </Grid>
      </Grid>
    </Stack>
  );
};
