import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import type { Profile, ProgressSummary, ReviewItem, StoredSession } from '@/shared/api';
import {
  authenticateTelegramMiniApp,
  fetchProfile,
  fetchProgressSummary,
  fetchReviewItems,
  submitPracticeMessage,
} from '@/shared/api';
import { profileLanguageToLocale, useAppI18n } from '@/shared/i18n/useAppI18n';
import { setActiveLearningLanguage } from '@/shared/language/runtime';
import { readStoredLearningLanguage, saveStoredLearningLanguage } from '@/shared/language/storage';
import type { LearningLanguage } from '@/shared/language/types';
import { learningLanguageLabels, learningLanguages } from '@/shared/language/types';
import { isUnauthorized } from '@/shared/lib/format';
import {
  clearStoredSession,
  isSessionExpired,
  readStoredSession,
  saveStoredSession,
} from '@/shared/session/session';
import { getTelegramInitData } from '@/shared/telegram/telegram';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';

import {
  type DailyPlanItem,
  type LanguageScopeState,
  LayoutContextProvider,
  type LayoutContextValue,
  type QuickAction,
} from './LayoutContext';

type StatusTone = 'info' | 'warning' | 'error' | 'success';

interface TabDefinition {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  matchPaths: string[];
}

interface LayoutProps {
  tabs: TabDefinition[];
}

const emptySummary: ProgressSummary = {
  sessions_total: 0,
  open_mistakes: 0,
  review_due_now: 0,
  recent_sessions: [],
};

const createEmptyLanguageState = (): LanguageScopeState => ({
  profile: null,
  reviewItems: [],
  summary: emptySummary,
  practiceInput: '',
  practiceResult: null,
  dailyPlan: [],
  weakTopics: [],
  quickActions: [],
});

const initialLanguageState: Record<LearningLanguage, LanguageScopeState> = {
  en: createEmptyLanguageState(),
  es: createEmptyLanguageState(),
};

const matchTab = (pathname: string, tabs: TabDefinition[]): TabDefinition =>
  tabs.find((tab) =>
    tab.matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  ) ?? tabs[0];

export const Layout = ({ tabs }: LayoutProps) => {
  const storedLanguage = readStoredLearningLanguage() ?? 'en';
  const { i18n, t } = useAppI18n();
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const [status, setStatus] = useState(() => t('status.connectingTelegram'));
  const [statusTone, setStatusTone] = useState<StatusTone>('info');
  const [currentLanguage, setCurrentLanguage] = useState<LearningLanguage>(storedLanguage);
  const [languageState, setLanguageState] =
    useState<Record<LearningLanguage, LanguageScopeState>>(initialLanguageState);
  const [isPracticePending, setIsPracticePending] = useState(false);
  const [isReviewPending, setIsReviewPending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setActiveLearningLanguage(currentLanguage);
    saveStoredLearningLanguage(currentLanguage);
  }, [currentLanguage]);

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
            await hydrateLanguage(currentLanguage, storedSession.accessToken, ignore);
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

        await authenticateWithTelegram(ignore);
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

    void bootstrap();

    return () => {
      ignore = true;
    };
    // Intentional one-time bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authenticateWithTelegram(ignore = false): Promise<StoredSession> {
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

    const nextSession: StoredSession = {
      accessToken: authPayload.access_token,
      expiresAt: authPayload.expires_at,
    };

    saveStoredSession(nextSession);

    if (!ignore) {
      setSession(nextSession);
    }

    await hydrateLanguage(currentLanguage, nextSession.accessToken, ignore, authPayload.profile);

    return nextSession;
  }

  async function hydrateLanguage(
    language: LearningLanguage,
    accessToken: string,
    ignore = false,
    profile?: Profile,
  ): Promise<void> {
    setActiveLearningLanguage(language);

    const [progressSummary, todayReview, activeProfile] = await Promise.all([
      fetchProgressSummary(accessToken),
      fetchReviewItems(accessToken),
      profile ? Promise.resolve(profile) : fetchProfile(accessToken),
    ]);

    if (ignore) {
      return;
    }

    setLanguageState((current) => ({
      ...current,
      [language]: {
        ...current[language],
        profile: activeProfile,
        reviewItems: todayReview.items,
        summary: progressSummary,
        dailyPlan: buildDailyPlan(todayReview.items, progressSummary, t),
        weakTopics: buildWeakTopics(todayReview.items),
        quickActions: buildQuickActions(t),
        practiceInput: '',
        practiceResult: null,
      },
    }));
    updateStatus(
      t('status.languageActive', { language: learningLanguageLabels[language] }),
      'success',
    );
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
      activeSession = await authenticateWithTelegram();
    }

    try {
      return await operation(activeSession.accessToken);
    } catch (error) {
      if (!retryAuth || !isUnauthorized(error)) {
        throw error;
      }

      clearStoredSession();
      setSession(null);
      const refreshedSession = await authenticateWithTelegram();
      return operation(refreshedSession.accessToken);
    }
  }

  async function handleRefreshReview(): Promise<void> {
    try {
      setIsReviewPending(true);
      setActiveLearningLanguage(currentLanguage);
      const payload = await withAuthorizedSession(fetchReviewItems);
      setLanguageState((current) => ({
        ...current,
        [currentLanguage]: {
          ...current[currentLanguage],
          reviewItems: payload.items,
          dailyPlan: buildDailyPlan(payload.items, current[currentLanguage].summary, t),
          weakTopics: buildWeakTopics(payload.items),
        },
      }));
      updateStatus(t('status.reviewQueueUpdated'), 'info');
    } catch (error) {
      updateStatus(getErrorMessage(error, t('status.refreshReviewFailed')), 'error');
    } finally {
      setIsReviewPending(false);
    }
  }

  async function handleSubmitPractice(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const activeState = languageState[currentLanguage];
    const text = activeState.practiceInput.trim();

    if (!text) {
      updateStatus(t('status.enterPracticeMessage'), 'warning');
      return;
    }

    try {
      setIsPracticePending(true);
      updateStatus(t('status.sendingMessage'), 'info');
      setActiveLearningLanguage(currentLanguage);

      const response = await withAuthorizedSession((accessToken) =>
        submitPracticeMessage(accessToken, text),
      );

      const [progressSummary, todayReview] = await Promise.all([
        withAuthorizedSession(fetchProgressSummary),
        withAuthorizedSession(fetchReviewItems),
      ]);

      setLanguageState((current) => ({
        ...current,
        [currentLanguage]: {
          ...current[currentLanguage],
          practiceInput: '',
          practiceResult: response,
          summary: progressSummary,
          reviewItems: todayReview.items,
          dailyPlan: buildDailyPlan(todayReview.items, progressSummary, t),
          weakTopics: buildWeakTopics(todayReview.items),
        },
      }));
      updateStatus(t('status.replyReady'), 'success');
    } catch (error) {
      updateStatus(getErrorMessage(error, t('status.sendPracticeFailed')), 'error');
    } finally {
      setIsPracticePending(false);
    }
  }

  async function switchLanguage(language: LearningLanguage): Promise<void> {
    if (language === currentLanguage) {
      return;
    }

    try {
      setIsLanguageSwitching(true);
      setCurrentLanguage(language);
      setActiveLearningLanguage(language);
      setLanguageState((current) => ({
        ...current,
        [language]: {
          ...current[language],
          practiceInput: '',
          practiceResult: null,
        },
      }));
      updateStatus(
        t('status.switchingLanguage', { language: learningLanguageLabels[language] }),
        'info',
      );
      await withAuthorizedSession((accessToken) => hydrateLanguage(language, accessToken), false);
    } catch (error) {
      updateStatus(getErrorMessage(error, t('status.languageSwitchFailed')), 'error');
    } finally {
      setIsLanguageSwitching(false);
    }
  }

  const updateStatus = (message: string, tone: StatusTone): void => {
    setStatus(message);
    setStatusTone(tone);
  };

  const activeTab = matchTab(location.pathname, tabs);
  const activeLanguageState = languageState[currentLanguage];
  const context: LayoutContextValue = {
    session,
    currentLanguage,
    currentSectionTitle: activeTab.label,
    availableLanguages: [...learningLanguages],
    isAuthorized: Boolean(session?.accessToken),
    isBootstrapping,
    isLanguageSwitching,
    isPracticePending,
    isReviewPending,
    status,
    statusTone,
    languageState: activeLanguageState,
    switchLanguage,
    handleRefreshReview,
    handleSubmitPractice,
    setPracticeInput: (value: string) =>
      setLanguageState((current) => ({
        ...current,
        [currentLanguage]: {
          ...current[currentLanguage],
          practiceInput: value,
        },
      })),
  };

  return (
    <LayoutContextProvider value={context}>
      <Box sx={{ minHeight: '100vh', pb: 'calc(68px + env(safe-area-inset-bottom))' }}>
        <AppBar
          position="sticky"
          color="transparent"
          sx={{
            top: 0,
            backdropFilter: 'blur(18px)',
            backgroundImage:
              'radial-gradient(circle at top left, rgba(84, 156, 255, 0.18) 0%, rgba(84, 156, 255, 0.08) 24%, rgba(0, 0, 0, 0.10) 58%, rgba(0, 0, 0, 0.04) 100%)',
            bgcolor: '#00000020',
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
            <Stack direction="row" spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap>
                  {activeTab.label}
                </Typography>
              </Box>

              <Select
                value={currentLanguage}
                size="small"
                disabled={isBootstrapping || isLanguageSwitching}
                onChange={(event) => {
                  void switchLanguage(event.target.value as LearningLanguage);
                }}
                sx={{ minWidth: 88 }}
              >
                {learningLanguages.map((language) => (
                  <MenuItem key={language} value={language}>
                    {learningLanguageLabels[language]}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            <Outlet />
          </Stack>
        </Container>

        <AppBar
          position="fixed"
          color="transparent"
          sx={{
            inset: 'auto 20px 10px',
            boxShadow: 'inset 0 1px 1px #ffffff55',
            backdropFilter: 'blur(18px)',
            bgcolor: '#00000020',
            borderRadius: '50px',
            width: 'calc(100vw - 40px)',
            p: '4px',
            borderBottom: '1px solid #ffffff11',
          }}
        >
          <Toolbar disableGutters sx={{ px: 1 }}>
            <BottomNavigation
              value={activeTab.id}
              showLabels={false}
              sx={{
                width: '100%',
                bgcolor: 'transparent',
                justifyContent: 'stretch',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 0,
                  maxWidth: 'none',
                  flex: 1,
                  px: 0.5,
                  borderRadius: '50px',
                },
              }}
            >
              {tabs.map((tab) => (
                <BottomNavigationAction
                  key={tab.id}
                  value={tab.id}
                  icon={tab.icon}
                  onClick={() => navigate(tab.path)}
                />
              ))}
            </BottomNavigation>
          </Toolbar>
        </AppBar>
      </Box>
    </LayoutContextProvider>
  );
};

const buildDailyPlan = (
  reviewItems: ReviewItem[],
  summary: ProgressSummary,
  t: (key: string, options?: Record<string, unknown>) => string,
): DailyPlanItem[] => [
  {
    id: 'mistakes',
    title: t('layout.dailyPlan.mistakes.title', {
      count: Math.min(Math.max(reviewItems.length, 3), 5),
    }),
    detail: summary.open_mistakes
      ? t('layout.dailyPlan.mistakes.detailOpen', { count: summary.open_mistakes })
      : t('layout.dailyPlan.mistakes.detailEmpty'),
    kind: 'review',
  },
  {
    id: 'scenario',
    title: t('layout.dailyPlan.scenario.title'),
    detail: summary.recent_sessions[0]
      ? t('layout.dailyPlan.scenario.detailContinue', {
          mode: t(`enum.mode.${summary.recent_sessions[0].mode}`, {
            defaultValue: summary.recent_sessions[0].mode.replace(/_/g, ' '),
          }),
        })
      : t('layout.dailyPlan.scenario.detailEmpty'),
    kind: 'scenario',
  },
  {
    id: 'vocabulary',
    title: t('layout.dailyPlan.vocabulary.title'),
    detail: reviewItems[0]?.correction
      ? t('layout.dailyPlan.vocabulary.detailUse', { correction: reviewItems[0].correction })
      : t('layout.dailyPlan.vocabulary.detailEmpty'),
    kind: 'vocabulary',
  },
];

const buildWeakTopics = (reviewItems: ReviewItem[]): string[] => {
  const counts = reviewItems.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([topic]) => topic.replace(/_/g, ' '));
};

const buildQuickActions = (t: (key: string) => string): QuickAction[] => [
  { id: 'conversation', label: t('home.quickActions.conversation'), path: '/practice' },
  { id: 'roleplay', label: t('home.quickActions.roleplay'), path: '/practice' },
  { id: 'mistakes', label: t('home.quickActions.mistakes'), path: '/review' },
];

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
