'use client';

import { usePathname, useRouter } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/HomeRounded';
import ChatIcon from '@mui/icons-material/ChatBubbleRounded';
import ReviewIcon from '@mui/icons-material/MenuBookRounded';
import BarChartIcon from '@mui/icons-material/BarChartRounded';
import SettingsIcon from '@mui/icons-material/TuneRounded';

const TABS = [
  { path: '/home', label: 'Home', Icon: HomeIcon },
  { path: '/practice', label: 'Practice', Icon: ChatIcon },
  { path: '/review', label: 'Review', Icon: ReviewIcon },
  { path: '/progress', label: 'Progress', Icon: BarChartIcon },
  { path: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const value = TABS.findIndex((t) => pathname.startsWith(t.path));

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: 'var(--safe-area-bottom)',
      }}
    >
      <BottomNavigation
        value={value < 0 ? 0 : value}
        onChange={(_, idx) => router.push(TABS[idx].path)}
        sx={{ bgcolor: 'background.paper' }}
      >
        {TABS.map(({ label, Icon }) => (
          <BottomNavigationAction
            key={label}
            label={label}
            icon={<Icon fontSize="small" />}
            sx={{ minWidth: 0, fontSize: '0.65rem' }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
