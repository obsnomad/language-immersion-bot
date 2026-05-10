import { useNavigate } from 'react-router-dom';

import { useAppI18n } from '@/shared/i18n/useAppI18n';
import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import {
  ArrowForwardRounded,
  AutoAwesomeRounded,
  FlagRounded,
  PlayCircleRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

const planTone = {
  review: 'warning',
  scenario: 'primary',
  vocabulary: 'success',
} as const;

export const HomePage = () => {
  const navigate = useNavigate();
  const { formatCategory, formatMode, t } = useAppI18n();
  const { isAuthorized, languageState } = useLayoutContext();
  const { dailyPlan, practiceResult, quickActions, summary, weakTopics } = languageState;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t('home.heading.eyebrow')}
        </Typography>
        <Typography variant="h4">{t('home.heading.title')}</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">{t('home.dailyPlan.title')}</Typography>
            <Grid container spacing={2}>
              {dailyPlan.map((item) => (
                <Grid key={item.id} size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack spacing={1.25}>
                        <Chip
                          label={t(`home.plan.kind.${item.kind}`)}
                          color={planTone[item.kind]}
                          size="small"
                          sx={{ width: 'fit-content' }}
                        />
                        <Typography variant="subtitle1">{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.detail}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {practiceResult ? (
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6">{t('home.continue.title')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.continue.detail', {
                    mode: formatMode(practiceResult.mode),
                    language: practiceResult.language.toUpperCase(),
                  })}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PlayCircleRounded />}
                endIcon={<ArrowForwardRounded />}
                onClick={() => navigate('/practice')}
              >
                {t('home.continue.action')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t('home.quickActions.title')}</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outlined"
                      startIcon={<AutoAwesomeRounded />}
                      onClick={() => navigate(action.path)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t('home.weakTopics.title')}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {(weakTopics.length ? weakTopics : ['grammar', 'word order', 'vocabulary']).map((topic) => (
                    <Chip
                      key={topic}
                      label={formatCategory(topic.replace(/ /g, '_'))}
                      icon={<FlagRounded />}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('home.stats.streak')}
              </Typography>
              <Typography variant="h4">{Math.max(summary.sessions_total, 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('home.stats.sessionsThisWeek')}
              </Typography>
              <Typography variant="h4">{summary.recent_sessions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('home.stats.reviewDue')}
              </Typography>
              <Typography variant="h4">{isAuthorized ? summary.review_due_now : 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};
