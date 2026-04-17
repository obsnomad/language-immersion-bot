import type { TelegramThemeSettings } from '@/shared/telegram/telegram';
import { alpha, createTheme } from '@mui/material/styles';

const fallbackColors = {
  light: {
    bg: '#ffffff',
    secondaryBg: '#f4f4f5',
    text: '#1c1c1e',
    hint: '#707579',
    link: '#2481cc',
    button: '#2481cc',
    buttonText: '#ffffff',
    headerBg: '#ffffff',
    accentText: '#2481cc',
    sectionBg: '#ffffff',
    sectionHeaderText: '#6d6d71',
    subtitleText: '#707579',
    destructiveText: '#d14e4e',
    sectionSeparator: '#d9d9de',
    bottomBarBg: '#ffffff',
  },
  dark: {
    bg: '#212121',
    secondaryBg: '#181818',
    text: '#ffffff',
    hint: '#aaaaaa',
    link: '#62bcf9',
    button: '#50a8eb',
    buttonText: '#ffffff',
    headerBg: '#212121',
    accentText: '#62bcf9',
    sectionBg: '#212121',
    sectionHeaderText: '#aaaaaa',
    subtitleText: '#aaaaaa',
    destructiveText: '#ff7b72',
    sectionSeparator: '#3a3a3c',
    bottomBarBg: '#181818',
  },
} as const;

export const createAppTheme = ({ colorScheme, themeParams }: TelegramThemeSettings) => {
  const fallback = fallbackColors[colorScheme];
  const colors = {
    bg: themeParams.bg_color ?? fallback.bg,
    secondaryBg: themeParams.secondary_bg_color ?? fallback.secondaryBg,
    text: themeParams.text_color ?? fallback.text,
    hint: themeParams.hint_color ?? fallback.hint,
    link: themeParams.link_color ?? fallback.link,
    button: themeParams.button_color ?? fallback.button,
    buttonText: themeParams.button_text_color ?? fallback.buttonText,
    headerBg: themeParams.header_bg_color ?? fallback.headerBg,
    accentText: themeParams.accent_text_color ?? fallback.accentText,
    sectionBg: themeParams.section_bg_color ?? fallback.sectionBg,
    sectionHeaderText: themeParams.section_header_text_color ?? fallback.sectionHeaderText,
    subtitleText: themeParams.subtitle_text_color ?? fallback.subtitleText,
    destructiveText: themeParams.destructive_text_color ?? fallback.destructiveText,
    sectionSeparator: themeParams.section_separator_color ?? fallback.sectionSeparator,
    bottomBarBg: themeParams.bottom_bar_bg_color ?? fallback.bottomBarBg,
  };

  return createTheme({
    palette: {
      mode: colorScheme,
      primary: {
        main: colors.button,
        contrastText: colors.buttonText,
      },
      secondary: {
        main: colors.accentText,
      },
      error: {
        main: colors.destructiveText,
      },
      background: {
        default: colors.bg,
        paper: colors.sectionBg,
      },
      text: {
        primary: colors.text,
        secondary: colors.subtitleText,
      },
      divider: colors.sectionSeparator,
      info: {
        main: colors.link,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.bg,
            color: colors.text,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.headerBg,
            color: colors.text,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: colors.sectionBg,
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: colors.bottomBarBg,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: colors.hint,
            '&.Mui-selected': {
              color: colors.button,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            boxShadow: 'none',
          },
          outlined: {
            borderColor: alpha(colors.button, 0.35),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          outlined: {
            borderColor: colors.sectionSeparator,
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            '& a': {
              color: colors.link,
            },
          },
        },
      },
    },
  });
};
