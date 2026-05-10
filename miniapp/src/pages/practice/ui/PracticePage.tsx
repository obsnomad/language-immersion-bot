import { PracticeSection } from '@/features/practice-message/ui/PracticeSection';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { MicRounded, RecordVoiceOverRounded, SchoolRounded } from '@mui/icons-material';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';

const modes = [
  { id: 'conversation', icon: <MicRounded /> },
  { id: 'roleplay', icon: <RecordVoiceOverRounded /> },
  { id: 'interview', icon: <SchoolRounded /> },
  { id: 'grammar', icon: <SchoolRounded /> },
  { id: 'vocabulary', icon: <SchoolRounded /> },
  { id: 'writing', icon: <SchoolRounded /> },
];

const scenarios = ['job_interview', 'airport', 'doctor', 'renting_apartment', 'small_talk'] as const;

export const PracticePage = () => {
  const { formatMode, t } = useAppI18n();
  const {
    handleSubmitPractice,
    isAuthorized,
    isBootstrapping,
    isLanguageSwitching,
    isPracticePending,
    languageState,
    setPracticeInput,
  } = useLayoutContext();

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">{t('practicePage.modes.title')}</Typography>
            <Grid container spacing={1.5}>
              {modes.map((mode) => (
                <Grid key={mode.id} size={{ xs: 6, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack spacing={1.25}>
                        <Chip icon={mode.icon} label={formatMode(mode.id)} variant="outlined" />
                        <Typography variant="body2" color="text.secondary">
                          {t('practicePage.modes.description')}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">{t('practicePage.scenarios.title')}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {scenarios.map((scenario) => (
                <Chip key={scenario} label={t(`practicePage.scenarios.items.${scenario}`)} color="primary" variant="outlined" />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <PracticeSection
        practiceInput={languageState.practiceInput}
        onPracticeInputChange={(event) => setPracticeInput(event.target.value)}
        onSubmit={handleSubmitPractice}
        isPracticePending={isPracticePending}
        isAuthorized={isAuthorized}
        isBootstrapping={isBootstrapping || isLanguageSwitching}
        practiceResult={languageState.practiceResult}
      />
    </Stack>
  );
};
