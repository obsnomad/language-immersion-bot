'use client';

import * as React from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTelegram } from './TelegramProvider';

function buildTheme(colorScheme: 'light' | 'dark', themeParams: Record<string, string>) {
  const isDark = colorScheme === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: themeParams.button_color ?? (isDark ? '#5288c1' : '#2481cc'),
        contrastText: themeParams.button_text_color ?? '#ffffff',
      },
      background: {
        default: themeParams.bg_color ?? (isDark ? '#17212b' : '#f4f4f5'),
        paper: themeParams.secondary_bg_color ?? (isDark ? '#232e3c' : '#ffffff'),
      },
      text: {
        primary: themeParams.text_color ?? (isDark ? '#e8eaed' : '#1a1a1a'),
        secondary: themeParams.hint_color ?? (isDark ? '#708499' : '#8a8a8a'),
      },
      error: { main: '#e53935' },
      warning: { main: '#fb8c00' },
      success: { main: '#43a047' },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiBottomNavigation: {
        styleOverrides: { root: { height: 60 } },
      },
    },
  });
}

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { colorScheme, twa } = useTelegram();

  const [{ cache, flush }] = React.useState(() => {
    const c = createCache({ key: 'mui', prepend: true });
    (c as { compat?: boolean }).compat = true;
    const prevInsert = c.insert.bind(c);
    let inserted: string[] = [];
    c.insert = (...args: Parameters<typeof c.insert>) => {
      const serialized = args[1] as { name: string };
      if (c.inserted[serialized.name] === undefined) inserted.push(serialized.name);
      return prevInsert(...args);
    };
    return {
      cache: c,
      flush: () => {
        const p = inserted;
        inserted = [];
        return p;
      },
    };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (!names.length) return null;
    let styles = '';
    for (const name of names) styles += cache.inserted[name];
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  const themeParams = (twa?.themeParams ?? {}) as Record<string, string>;
  const theme = React.useMemo(
    () => buildTheme(colorScheme, themeParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorScheme, JSON.stringify(themeParams)],
  );

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
