import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppI18n } from '@/shared/i18n/useAppI18n';
import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { ReviewSection } from '@/widgets/review-section/ui/ReviewSection';
import { PlayArrowRounded } from '@mui/icons-material';
import { Button, Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';

export const ReviewPage = () => {
  const navigate = useNavigate();
  const { t } = useAppI18n();
  const [tab, setTab] = useState<'today' | 'mistakes'>('today');
  const {
    handleRefreshReview,
    isAuthorized,
    isBootstrapping,
    isLanguageSwitching,
    isReviewPending,
    languageState,
  } = useLayoutContext();

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
              <Tab value="today" label={t('reviewPage.tabs.today')} />
              <Tab value="mistakes" label={t('reviewPage.tabs.mistakes')} />
            </Tabs>
            <Typography variant="body2" color="text.secondary">
              {tab === 'today'
                ? t('reviewPage.todayReady', { count: languageState.reviewItems.length })
                : t('reviewPage.mistakesHint')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PlayArrowRounded />}
              onClick={() => navigate('/practice')}
              sx={{ width: 'fit-content' }}
            >
              {t('reviewPage.retryInPractice')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <ReviewSection
        reviewItems={languageState.reviewItems}
        isAuthorized={isAuthorized}
        isReviewPending={isReviewPending}
        isBootstrapping={isBootstrapping || isLanguageSwitching}
        onRefresh={() => {
          void handleRefreshReview();
        }}
      />
    </Stack>
  );
};
