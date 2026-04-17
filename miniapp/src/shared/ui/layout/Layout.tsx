import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import type {
  PracticeMessageResponse,
  Profile,
  ProgressSummary,
  ReviewItem,
  StoredSession,
} from '@/shared/api';
import {
  authenticateTelegramMiniApp,
  fetchProfile,
  fetchProgressSummary,
  fetchReviewItems,
  submitPracticeMessage,
} from '@/shared/api';
import { profileLanguageToLocale, useAppI18n } from '@/shared/i18n/useAppI18n';
import { isUnauthorized } from '@/shared/lib/format';
import {
  clearStoredSession,
  isSessionExpired,
  readStoredSession,
  saveStoredSession,
} from '@/shared/session/session';
import { getTelegramInitData } from '@/shared/telegram/telegram';
import {
  Alert,
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  Stack,
  Toolbar,
} from '@mui/material';

import type { LayoutContextValue } from './LayoutContext';

type TabId = 'dashboard' | 'review' | 'conversation' | 'repeat-words';
type TabPath = `/${TabId}`;

const emptySummary: ProgressSummary = {
  sessions_total: 0,
  open_mistakes: 0,
  review_due_now: 0,
  recent_sessions: [],
};

type StatusTone = 'info' | 'warning' | 'error' | 'success';

interface LayoutProps {
  tabs: Array<{ id: TabId; label: string; icon: ReactNode; path: TabPath }>;
}

export const Layout = ({ tabs }: LayoutProps) => {
  const { i18n, t } = useAppI18n();
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const [status, setStatus] = useState(() => t('status.connectingTelegram'));
  const [statusTone, setStatusTone] = useState<StatusTone>('info');
  const [summary, setSummary] = useState(emptySummary);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceResult, setPracticeResult] = useState<PracticeMessageResponse | null>(null);
  const [isPracticePending, setIsPracticePending] = useState(false);
  const [isReviewPending, setIsReviewPending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      try {
        const storedSession = readStoredSession();
        if (storedSession && !isSessionExpired(storedSession)) {
          if (!ignore) {
            setSession(storedSession);
            updateStatus(t('status.restoringSession'), 'info');
          }
          try {
            await hydrateTabs(storedSession.accessToken, ignore);
            return;
          } catch (error) {
            if (!isUnauthorized(error)) {
              throw error;
            }
            clearStoredSession();
            if (!ignore) {
              setSession(null);
            }
          }
        }

        await authenticateWithTelegram({ ignore });
      } catch (error) {
        if (!ignore) {
          updateStatus(getErrorMessage(error, t('status.openFromTelegram')), 'warning');
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      ignore = true;
    };
    // The bootstrap flow is intentionally a one-time mount effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authenticateWithTelegram({
    ignore = false,
  }: {
    ignore?: boolean;
    silent?: boolean;
  } = {}): Promise<StoredSession> {
    const initData = getTelegramInitData();
    if (!initData) {
      if (!ignore) {
        updateStatus(t('status.openFromTelegram'), 'warning');
      }
      throw new Error(t('status.telegramInitRequired'));
    }

    if (!ignore) {
      updateStatus(t('status.authorizingTelegram'), 'info');
    }

    const authPayload = await authenticateTelegramMiniApp(initData);
    await i18n.changeLanguage(profileLanguageToLocale(authPayload.profile.native_language));

    const nextSession = {
      accessToken: authPayload.access_token,
      expiresAt: authPayload.expires_at,
    } satisfies StoredSession;
    saveStoredSession(nextSession);

    if (!ignore) {
      setSession(nextSession);
    }

    await hydrateTabs(nextSession.accessToken, ignore, authPayload.profile);
    return nextSession;
  }

  async function hydrateTabs(
    accessToken: string,
    ignore = false,
    profile?: Profile,
  ): Promise<void> {
    const [progressSummary, todayReview, activeProfile] = await Promise.all([
      fetchProgressSummary(accessToken),
      fetchReviewItems(accessToken),
      profile ? Promise.resolve(profile) : fetchProfile(accessToken),
    ]);

    if (ignore) {
      return;
    }

    await i18n.changeLanguage(profileLanguageToLocale(activeProfile.native_language));
    setSummary(progressSummary);
    setReviewItems(todayReview.items);
    updateStatus(t('status.sessionActive'), 'success');
  }

  async function withAuthorizedSession<TResponse>(
    operation: (accessToken: string) => Promise<TResponse>,
    retryAuth = true,
  ): Promise<TResponse> {
    let activeSession = session || readStoredSession();
    if (!activeSession || isSessionExpired(activeSession)) {
      clearStoredSession();
      setSession(null);
      if (!retryAuth) {
        throw new Error(t('status.sessionExpired'));
      }
      activeSession = await authenticateWithTelegram({ silent: true });
    }

    try {
      return await operation(activeSession.accessToken);
    } catch (error) {
      if (!retryAuth || !isUnauthorized(error)) {
        throw error;
      }

      clearStoredSession();
      setSession(null);
      const refreshedSession = await authenticateWithTelegram({ silent: true });
      return operation(refreshedSession.accessToken);
    }
  }

  async function handleRefreshReview(): Promise<void> {
    try {
      setIsReviewPending(true);
      const payload = await withAuthorizedSession(fetchReviewItems);
      setReviewItems(payload.items);
      updateStatus(t('status.reviewQueueUpdated'), 'info');
    } catch (error) {
      updateStatus(getErrorMessage(error, t('status.refreshReviewFailed')), 'error');
    } finally {
      setIsReviewPending(false);
    }
  }

  async function handleSubmitPractice(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const text = practiceInput.trim();
    if (!text) {
      updateStatus(t('status.enterPracticeMessage'), 'warning');
      return;
    }

    try {
      setIsPracticePending(true);
      updateStatus(t('status.sendingMessage'), 'info');
      const response = await withAuthorizedSession((accessToken) =>
        submitPracticeMessage(accessToken, text),
      );
      setPracticeResult(response);
      setPracticeInput('');

      const [progressSummary, todayReview] = await Promise.all([
        withAuthorizedSession(fetchProgressSummary),
        withAuthorizedSession(fetchReviewItems),
      ]);
      setSummary(progressSummary);
      setReviewItems(todayReview.items);
      updateStatus(t('status.replyReady'), 'success');
    } catch (error) {
      updateStatus(getErrorMessage(error, t('status.sendPracticeFailed')), 'error');
    } finally {
      setIsPracticePending(false);
    }
  }

  const updateStatus = (message: string, tone: StatusTone): void => {
    setStatus(message);
    setStatusTone(tone);
  };

  const isAuthorized = Boolean(session?.accessToken);
  const activeTab = tabs.find((tab) => tab.path === location.pathname)?.id ?? 'dashboard';
  const context: LayoutContextValue = {
    handleRefreshReview,
    handleSubmitPractice,
    isAuthorized,
    isBootstrapping,
    isPracticePending,
    isReviewPending,
    practiceInput,
    practiceResult,
    reviewItems,
    setPracticeInput,
    summary,
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 'calc(92px + env(safe-area-inset-bottom))' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
        <Stack component="div" spacing={3}>
          <Alert severity={statusTone} variant="outlined">
            {status}
          </Alert>
          <Outlet context={context} />
        </Stack>
      </Container>
      <AppBar
        position="fixed"
        color="transparent"
        sx={{
          inset: 'auto 10px 10px',
          boxShadow: 'none',
          backdropFilter: 'blur(18px)',
          bgcolor: 'transparent',
          borderRadius: '100px',
          width: 'calc(100vw - 20px)',
        }}
      >
        <Toolbar disableGutters sx={{ px: 1 }}>
          <BottomNavigation value={activeTab} sx={{ width: '100%', bgcolor: 'transparent' }}>
            {tabs.map((tab) => (
              <BottomNavigationAction
                key={tab.id}
                value={tab.id}
                label={tab.label}
                icon={tab.icon}
                onClick={() => navigate(tab.path)}
              />
            ))}
          </BottomNavigation>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
