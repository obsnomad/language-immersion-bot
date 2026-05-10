'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';
import { useAuth } from '@/components/providers/AuthProvider';
import type { ReviewItem } from '@/types';
import styles from './ReviewPage.module.css';

export function ReviewPage() {
  const { token, language, isAuthorized } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [allItems, setAllItems] = useState<ReviewItem[]>([]);
  const [loadingDue, setLoadingDue] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token ?? ''}`, 'X-Language': language }),
    [token, language],
  );

  useEffect(() => {
    if (!token) {
      setLoadingDue(false);
      setLoadingAll(false);
      return;
    }

    setLoadingDue(true);
    setLoadingAll(true);
    fetch('/api/learning/review/today', { headers: authHeaders })
      .then((r) => r.json())
      .then((items) => setDueItems(Array.isArray(items) ? items : []))
      .finally(() => setLoadingDue(false));
    fetch('/api/learning/mistakes', { headers: authHeaders })
      .then((r) => r.json())
      .then((items) => setAllItems(Array.isArray(items) ? items : []))
      .finally(() => setLoadingAll(false));
  }, [token, language, authHeaders]);

  async function refreshDue() {
    if (!token) return;
    setLoadingDue(true);
    const items = await fetch('/api/learning/review/today', { headers: authHeaders }).then((res) =>
      res.json(),
    );
    setDueItems(Array.isArray(items) ? items : []);
    setLoadingDue(false);
  }

  const items = tab === 0 ? dueItems : allItems;
  const loading = tab === 0 ? loadingDue : loadingAll;

  return (
    <Box className={styles.page}>
      <Box className={styles.header}>
        <Typography variant="h6" fontWeight={700}>
          Review
        </Typography>
        <IconButton size="small" onClick={refreshDue} disabled={loadingDue || !isAuthorized}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
            <Tab
              label={`Today${!loadingDue && dueItems.length ? ` (${dueItems.length})` : ''}`}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label={`All mistakes${!loadingAll && allItems.length ? ` (${allItems.length})` : ''}`}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tab === 0
              ? `${dueItems.length} item${dueItems.length === 1 ? '' : 's'} ready today.`
              : 'Use this queue to retry mistakes in practice.'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={() => router.push('/practice?mode=review')}
          >
            Retry in practice
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingCards />
      ) : items.length === 0 ? (
        <EmptyState
          message={
            isAuthorized
              ? tab === 0
                ? 'Nothing due right now. Keep practising!'
                : 'No open mistakes yet.'
              : 'Open this mini-app from Telegram to load review items.'
          }
        />
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <MistakeCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Box>
  );
}

function MistakeCard({ item }: { item: ReviewItem }) {
  return (
    <Card>
      <CardContent>
        <Box className={styles.rowBetween}>
          <Chip
            label={item.type}
            size="small"
            color={item.severity >= 4 ? 'error' : item.severity >= 2 ? 'warning' : 'default'}
          />
          <Typography variant="caption" color="text.secondary">
            Severity {item.severity}/5
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.sourceText}</span>
          {' -> '}
          <strong>{item.correction}</strong>
        </Typography>
        {item.explanation && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {item.explanation}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h5">No review items</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
}

function LoadingCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
      ))}
    </div>
  );
}
