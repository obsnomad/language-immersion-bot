import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import {
  DarkModeRounded,
  NotificationsRounded,
  TrackChangesRounded,
  TranslateRounded,
} from '@mui/icons-material';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';

export const SettingsPage = () => {
  const { t } = useAppI18n();
  const { currentLanguage, languageState } = useLayoutContext();
  const profile = languageState.profile;

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t('settings.languageSpecific.title')}</Typography>
                <Chip
                  icon={<TranslateRounded />}
                  label={t('settings.languageSpecific.profile', { language: currentLanguage.toUpperCase() })}
                  sx={{ width: 'fit-content' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {t('settings.languageSpecific.level', { value: profile?.current_level ?? 'A2-B1' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.languageSpecific.goals', {
                    value: profile?.goals ?? t('settings.languageSpecific.goalsFallback'),
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.languageSpecific.correctionStyle', {
                    value: profile?.feedback_style ?? t('settings.languageSpecific.correctionStyleFallback'),
                  })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t('settings.global.title')}</Typography>
                <Chip icon={<NotificationsRounded />} label={t('settings.global.reminders', { value: '19:00' })} sx={{ width: 'fit-content' }} />
                <Chip icon={<TrackChangesRounded />} label={t('settings.global.timezone', { value: 'Europe/Moscow' })} sx={{ width: 'fit-content' }} />
                <Chip
                  icon={<DarkModeRounded />}
                  label={t('settings.global.theme', { value: t('settings.global.themeAdaptive') })}
                  sx={{ width: 'fit-content' }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};
