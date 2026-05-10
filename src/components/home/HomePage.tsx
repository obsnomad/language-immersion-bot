'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesomeRounded';
import FlagIcon from '@mui/icons-material/FlagRounded';
import PlayIcon from '@mui/icons-material/PlayCircleRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '@/components/providers/AuthProvider';
import { languageLabel, modeLabel, formatDate } from '@/lib/utils';
import type { ProgressSummary, ReviewItem } from '@/types';
import styles from './HomePage.module.css';

type PlanKind = 'review' | 'scenario' | 'vocabulary';

interface DailyPlanItem {
  id: string;
  kind: PlanKind;
  title: string;
  detail: string;
}

const planColors: Record<PlanKind, 'warning' | 'primary' | 'success'> = {
  review: 'warning',
  scenario: 'primary',
  vocabulary: 'success',
};

export function HomePage() {
  const { token, user, language, isAuthorized } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingReview, setLoadingReview] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token ?? ''}`, 'X-Language': language }),
    [token, language],
  );

  useEffect(() => {
    if (!token) {
      setLoadingSummary(false);
      setLoadingReview(false);
      return;
    }

    setLoadingSummary(true);
    setLoadingReview(true);
    Promise.all([
      fetch('/api/progress/summary', { headers: authHeaders }).then((r) => r.json()),
      fetch('/api/learning/review/today', { headers: authHeaders }).then((r) => r.json()),
    ])
      .then(([s, r]) => {
        setSummary(s);
        setReviewItems(Array.isArray(r) ? r : []);
      })
      .finally(() => {
        setLoadingSummary(false);
        setLoadingReview(false);
      });
  }, [token, language, authHeaders]);

  async function refreshReview() {
    if (!token) return;
    setLoadingReview(true);
    const items = await fetch('/api/learning/review/today', { headers: authHeaders }).then((res) =>
      res.json(),
    );
    setReviewItems(Array.isArray(items) ? items : []);
    setLoadingReview(false);
  }

  const dailyPlan = buildDailyPlan(reviewItems, summary);
  const weakTopics = buildWeakTopics(reviewItems);
  const lastSession = summary?.recentSessions?.[0];

  return (
    <Box className={styles.page}>
      <Box className={styles.greeting}>
        <Typography variant="h6" fontWeight={700}>
          Hello, {user?.firstName ?? 'there'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Learning {languageLabel(language)}
        </Typography>
      </Box>

      {!isAuthorized && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Open this mini-app from Telegram to authorize and load your learning data.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Daily plan"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 0 }}>
          <div className={styles.planGrid}>
            {dailyPlan.map((item) => (
              <Card key={item.id} variant="outlined" className={styles.planCard}>
                <CardContent>
                  <Chip
                    label={item.kind}
                    size="small"
                    color={planColors[item.kind]}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.detail}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {lastSession ? (
        <Card>
          <CardContent className={styles.continueCard}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Continue practice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last session: {modeLabel(lastSession.mode)} in {lastSession.language.toUpperCase()}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              endIcon={<ArrowForwardIosIcon sx={{ fontSize: 12 }} />}
              onClick={() => router.push('/practice')}
            >
              Resume
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className={styles.twoColumn}>
        <Card>
          <CardHeader
            title="Quick actions"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <div className={styles.actions}>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => router.push('/practice')}
              >
                Conversation
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => router.push('/practice?mode=scenario')}
              >
                Roleplay
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => router.push('/review')}
              >
                Mistakes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Weak topics"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <div className={styles.topicList}>
              {(weakTopics.length ? weakTopics : ['grammar', 'word order', 'vocabulary']).map(
                (topic) => (
                  <Chip key={topic} icon={<FlagIcon />} label={topic} variant="outlined" />
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Progress snapshot"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent>
          <div className={styles.metricsGrid}>
            <MetricCard
              label="Sessions"
              value={summary?.sessionCount}
              tone="primary"
              loading={loadingSummary}
            />
            <MetricCard
              label="Open mistakes"
              value={summary?.openMistakes}
              tone="warning"
              loading={loadingSummary}
            />
            <MetricCard
              label="Due today"
              value={isAuthorized ? summary?.reviewDue : 0}
              tone="success"
              loading={loadingSummary}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Today's review"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          action={
            <IconButton
              size="small"
              onClick={refreshReview}
              disabled={loadingReview || !isAuthorized}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {loadingReview ? (
            <ReviewSkeleton />
          ) : reviewItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {isAuthorized
                ? 'Nothing due right now. Keep practising!'
                : 'Authorize in Telegram to load review items.'}
            </Typography>
          ) : (
            <div className={styles.reviewList}>
              {reviewItems.slice(0, 3).map((item) => (
                <ReviewRow key={item.id} item={item} />
              ))}
              {reviewItems.length > 3 && (
                <ButtonBase className={styles.seeAll} onClick={() => router.push('/review')}>
                  <Typography variant="body2" color="primary">
                    See all {reviewItems.length} items
                  </Typography>
                  <ArrowForwardIosIcon sx={{ fontSize: 12 }} color="primary" />
                </ButtonBase>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Recent sessions"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          action={
            <ButtonBase onClick={() => router.push('/progress')}>
              <Typography variant="caption" color="primary">
                All
              </Typography>
            </ButtonBase>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {loadingSummary ? (
            <SessionSkeleton />
          ) : !summary?.recentSessions?.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Your recent practice sessions will appear here.
            </Typography>
          ) : (
            <div className={styles.sessionList}>
              {summary.recentSessions.map((s, i) => (
                <Box key={s.id}>
                  <Box className={styles.sessionRow}>
                    <Typography variant="body2" fontWeight={500}>
                      {modeLabel(s.mode)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(s.startedAt)}
                    </Typography>
                  </Box>
                  {i < summary.recentSessions.length - 1 && <Divider />}
                </Box>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function buildDailyPlan(
  reviewItems: ReviewItem[],
  summary: ProgressSummary | null,
): DailyPlanItem[] {
  return [
    {
      id: 'mistakes',
      kind: 'review',
      title: `Review ${Math.min(Math.max(reviewItems.length, 3), 5)} mistakes`,
      detail: summary?.openMistakes
        ? `${summary.openMistakes} open mistake${summary.openMistakes === 1 ? '' : 's'} in your queue`
        : 'Keep the review queue clear',
    },
    {
      id: 'scenario',
      kind: 'scenario',
      title: 'Scenario practice',
      detail: summary?.recentSessions?.[0]
        ? `Continue from ${modeLabel(summary.recentSessions[0].mode).toLowerCase()}`
        : 'Start with a practical real-world dialogue',
    },
    {
      id: 'vocabulary',
      kind: 'vocabulary',
      title: 'Vocabulary boost',
      detail: reviewItems[0]?.correction
        ? `Use "${reviewItems[0].correction}" in a new sentence`
        : 'Add useful words through conversation',
    },
  ];
}

function buildWeakTopics(reviewItems: ReviewItem[]): string[] {
  const counts = reviewItems.reduce<Record<string, number>>((acc, item) => {
    const key = item.type.replace(/_/g, ' ');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

function MetricCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number | undefined;
  tone: 'primary' | 'warning' | 'success';
  loading: boolean;
}) {
  return (
    <Box className={styles.metricCard}>
      {loading ? (
        <Skeleton width={40} height={40} />
      ) : (
        <Typography variant="h5" fontWeight={700} color={`${tone}.main`}>
          {value ?? 0}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function ReviewRow({ item }: { item: ReviewItem }) {
  return (
    <Box className={styles.reviewRow}>
      <Box className={styles.reviewRowTop}>
        <Chip
          label={item.type}
          size="small"
          color={item.severity >= 4 ? 'error' : item.severity >= 2 ? 'warning' : 'default'}
        />
        <Typography variant="caption" color="text.secondary">
          {item.severity}/5
        </Typography>
      </Box>
      <Typography variant="body2">
        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.sourceText}</span>
        {' -> '}
        <strong>{item.correction}</strong>
      </Typography>
      {item.explanation && (
        <Typography variant="caption" color="text.secondary">
          {item.explanation}
        </Typography>
      )}
    </Box>
  );
}

function ReviewSkeleton() {
  return (
    <div className={styles.reviewList}>
      {[1, 2].map((i) => (
        <Skeleton key={i} variant="rectangular" height={70} sx={{ borderRadius: 1, mb: 1 }} />
      ))}
    </div>
  );
}

function SessionSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={36} sx={{ my: 0.5 }} />
      ))}
    </>
  );
}
