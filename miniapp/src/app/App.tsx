import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { HomePage } from '@/pages/home/ui/HomePage';
import { PracticePage } from '@/pages/practice/ui/PracticePage';
import { ProgressPage } from '@/pages/progress/ui/ProgressPage';
import { ReviewPage } from '@/pages/review/ui/ReviewPage';
import { SettingsPage } from '@/pages/settings/ui/SettingsPage';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import {
  getTelegramThemeSettings,
  subscribeToTelegramThemeChange,
} from '@/shared/telegram/telegram';
import { Layout } from '@/shared/ui/layout/Layout';
import {
  AutoGraphRounded,
  CottageRounded,
  PsychologyRounded,
  SettingsRounded,
  SportsEsportsRounded,
} from '@mui/icons-material';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { createAppTheme } from './theme';

export const App = () => {
  const [themeSettings, setThemeSettings] = useState(getTelegramThemeSettings);
  const { t } = useAppI18n();

  useEffect(() => subscribeToTelegramThemeChange(setThemeSettings), []);

  return (
    <ThemeProvider theme={createAppTheme(themeSettings)}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout
                tabs={[
                  {
                    id: 'home',
                    label: t('nav.home'),
                    icon: <CottageRounded />,
                    path: '/home',
                    matchPaths: ['/home'],
                  },
                  {
                    id: 'practice',
                    label: t('nav.practice'),
                    icon: <SportsEsportsRounded />,
                    path: '/practice',
                    matchPaths: ['/practice'],
                  },
                  {
                    id: 'review',
                    label: t('nav.review'),
                    icon: <PsychologyRounded />,
                    path: '/review',
                    matchPaths: ['/review'],
                  },
                  {
                    id: 'progress',
                    label: t('nav.progress'),
                    icon: <AutoGraphRounded />,
                    path: '/progress',
                    matchPaths: ['/progress'],
                  },
                  {
                    id: 'settings',
                    label: t('nav.settings'),
                    icon: <SettingsRounded />,
                    path: '/settings',
                    matchPaths: ['/settings'],
                  },
                ]}
              />
            }
          >
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};
