import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ConversationPage } from '@/pages/conversation/ui/ConversationPage';
import { DashboardPage } from '@/pages/dashboard/ui/DashboardPage';
import { RepeatWordsPage } from '@/pages/repeat-words/ui/RepeatWordsPage';
import { ReviewPage } from '@/pages/review/ui/ReviewPage';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import {
  getTelegramThemeSettings,
  subscribeToTelegramThemeChange,
} from '@/shared/telegram/telegram';
import { Layout } from '@/shared/ui/layout/Layout';
import { ChatOutlined, HomeOutlined, ListOutlined, RepeatOutlined } from '@mui/icons-material';
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
                    id: 'dashboard',
                    label: t('nav.dashboard'),
                    icon: <HomeOutlined />,
                    path: '/dashboard',
                  },
                  { id: 'review', label: t('nav.review'), icon: <ListOutlined />, path: '/review' },
                  {
                    id: 'conversation',
                    label: t('nav.conversation'),
                    icon: <ChatOutlined />,
                    path: '/conversation',
                  },
                  {
                    id: 'repeat-words',
                    label: t('nav.repeatWords'),
                    icon: <RepeatOutlined />,
                    path: '/repeat-words',
                  },
                ]}
              />
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="conversation" element={<ConversationPage />} />
            <Route path="repeat-words" element={<RepeatWordsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};
