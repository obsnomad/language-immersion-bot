'use client';

import type { CSSProperties } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { BottomNav } from './BottomNav';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import styles from './AppShell.module.css';

function LoadingScreen() {
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
    </Stack>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const theme = useTheme();
  const paletteVars = {
    '--app-palette-background-default': theme.palette.background.default,
    '--app-palette-background-paper': theme.palette.background.paper,
    '--app-palette-text-primary': theme.palette.text.primary,
    '--app-palette-text-secondary': theme.palette.text.secondary,
    '--app-palette-primary-main': theme.palette.primary.main,
    '--app-palette-divider': theme.palette.divider,
    '--app-palette-action-hover': theme.palette.action.hover,
  } as CSSProperties;

  return (
    <Box
      className={styles.shell}
      style={paletteVars}
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        colorScheme: theme.palette.mode,
      }}
    >
      <Box component="main" className={styles.main}>
        {isLoading ? <LoadingScreen /> : children}
      </Box>
      <BottomNav />
    </Box>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
