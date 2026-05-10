import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { MetricCard } from '@/shared/ui/metric-card/MetricCard';
import { ProgressSnapshotSection } from '@/widgets/progress-snapshot/ui/ProgressSnapshotSection';
import { RecentSessionsSection } from '@/widgets/recent-sessions/ui/RecentSessionsSection';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import { BarChartRounded } from '@mui/icons-material';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';

export const ProgressPage = () => {
  const { formatCategory, t } = useAppI18n();
  const { isAuthorized, languageState } = useLayoutContext();
  const { reviewItems, summary, weakTopics } = languageState;

  return (
    <Stack spacing={3}>
      <ProgressSnapshotSection summary={summary} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t('progress.skills.title')}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard label={t('progress.skills.fluency')} value={summary.sessions_total * 4} tone="primary" />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard label={t('progress.skills.grammar')} value={Math.max(100 - reviewItems.length * 8, 12)} tone="warning" />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard label={t('progress.skills.vocabulary')} value={reviewItems.length * 3 + 12} tone="success" />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard label={t('progress.skills.confidence')} value={summary.recent_sessions.length * 10 + 20} tone="primary" />
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t('progress.topMistakes.title')}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {(weakTopics.length ? weakTopics : ['grammar', 'prepositions', 'articles']).map((topic) => (
                    <Chip
                      key={topic}
                      label={
                        topic === 'prepositions'
                          ? t('enum.category.prepositions')
                          : topic === 'articles'
                            ? t('enum.category.articles')
                            : formatCategory(topic.replace(/ /g, '_'))
                      }
                      icon={<BarChartRounded />}
                      variant="outlined"
                    />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t('progress.topMistakes.reviewCompletionRate', {
                    rate: summary.review_due_now ? Math.max(100 - reviewItems.length * 10, 20) : 100,
                  })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <RecentSessionsSection recentSessions={summary.recent_sessions} isAuthorized={isAuthorized} />
    </Stack>
  );
};
