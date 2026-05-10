'use client';

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import BarChartIcon from '@mui/icons-material/BarChartRounded';
import { useAuth } from '@/components/providers/AuthProvider';
import { modeLabel, formatDate } from '@/lib/utils';
import type { ProgressSummary, ReviewItem } from '@/types';
import styles from './ProgressPage.module.css';

interface Skills {
  grammar: number;
  vocabulary: number;
  fluency: number;
  confidence: number;
}

const SKILLS: Array<{ key: keyof Skills; label: string; color: 'primary' | 'secondary' | 'success' | 'warning' }> = [
  { key: 'fluency', label: 'Fluency', color: 'primary' },
  { key: 'grammar', label: 'Grammar', color: 'warning' },
  { key: 'vocabulary', label: 'Vocabulary', color: 'success' },
  { key: 'confidence', label: 'Confidence', color: 'primary' },
];

export function ProgressPage() {
  const { token, language, isAuthorized } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token ?? ''}`, 'X-Language': language }),
    [token, language],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch('/api/progress/summary', { headers: authHeaders }).then((r) => r.json()),
      fetch('/api/learning/mistakes', { headers: authHeaders }).then((r) => r.json()),
    ])
      .then(([nextSummary, mistakes]) => {
        setSummary(nextSummary);
        setReviewItems(Array.isArray(mistakes) ? mistakes : []);
      })
      .finally(() => setLoading(false));
  }, [token, language, authHeaders]);

  const skills = deriveSkills(summary, reviewItems);
  const weakTopics = buildWeakTopics(reviewItems);

  return (
    <Box className={styles.page}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Progress
      </Typography>

      {!isAuthorized && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Open this mini-app from Telegram to load progress.
            </Typography>
          </CardContent>
        </Card>
      )}

      <div className={styles.statsGrid}>
        <StatCard label="Sessions" value={summary?.sessionCount} loading={loading} color="primary.main" />
        <StatCard label="Open mistakes" value={summary?.openMistakes} loading={loading} color="warning.main" />
        <StatCard label="Due review" value={isAuthorized ? summary?.reviewDue : 0} loading={loading} color="success.main" />
      </div>

      <div className={styles.twoColumn}>
        <Card>
          <CardHeader title="Skills" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} />
          <CardContent sx={{ pt: 0 }}>
            {loading ? (
              <div className={styles.skillsList}>
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={48} />)}
              </div>
            ) : (
              <div className={styles.skillsList}>
                {SKILLS.map(({ key, label, color }) => (
                  <Box key={key}>
                    <Box className={styles.skillRow}>
                      <Typography variant="body2" fontWeight={500}>{label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {skills[key]}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={skills[key]}
                      color={color}
                      sx={{ borderRadius: 4, height: 6 }}
                    />
                  </Box>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Top mistakes" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} />
          <CardContent sx={{ pt: 0 }}>
            <div className={styles.topicList}>
              {(weakTopics.length ? weakTopics : ['grammar', 'prepositions', 'articles']).map((topic) => (
                <Chip key={topic} icon={<BarChartIcon />} label={topic} variant="outlined" />
              ))}
            </div>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Review completion rate: {summary?.reviewDue ? Math.max(100 - reviewItems.length * 10, 20) : 100}%
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent sessions" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} />
        <CardContent sx={{ pt: 0 }}>
          {loading ? (
            <>{[1, 2, 3].map((i) => <Skeleton key={i} height={40} sx={{ my: 0.25 }} />)}</>
          ) : !summary?.recentSessions?.length ? (
            <Typography variant="body2" color="text.secondary">
              No sessions yet. Start practising!
            </Typography>
          ) : (
            summary.recentSessions.map((s, i) => (
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
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function deriveSkills(summary: ProgressSummary | null, reviewItems: ReviewItem[]): Skills {
  return {
    fluency: clamp((summary?.sessionCount ?? 0) * 4),
    grammar: clamp(Math.max(100 - reviewItems.length * 8, 12)),
    vocabulary: clamp(reviewItems.length * 3 + 12),
    confidence: clamp((summary?.recentSessions?.length ?? 0) * 10 + 20),
  };
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

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function StatCard({
  label,
  value,
  loading,
  color,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: '12px !important' }}>
        {loading ? (
          <Skeleton width={48} height={40} sx={{ mx: 'auto' }} />
        ) : (
          <Typography variant="h4" fontWeight={700} color={color}>{value ?? 0}</Typography>
        )}
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}
