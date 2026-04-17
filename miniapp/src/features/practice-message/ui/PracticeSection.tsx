import type { ChangeEvent, FormEvent } from 'react';

import type { PracticeMessageResponse } from '@/shared/api';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

interface PracticeSectionProps {
  practiceInput: string;
  onPracticeInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPracticePending: boolean;
  isAuthorized: boolean;
  isBootstrapping: boolean;
  practiceResult: PracticeMessageResponse | null;
}

export const PracticeSection = ({
  practiceInput,
  onPracticeInputChange,
  onSubmit,
  isPracticePending,
  isAuthorized,
  isBootstrapping,
  practiceResult,
}: PracticeSectionProps) => {
  const { formatMode, t } = useAppI18n();

  return (
    <Stack component="div" spacing={2.5}>
      <div>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t('practice.section')}
        </Typography>
        <Typography variant="h4">{t('practice.title')}</Typography>
      </div>
      <Card>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Stack component="div" spacing={2}>
              <TextField
                label={t('practice.messageLabel')}
                name="text"
                multiline
                rows={5}
                placeholder={t('practice.placeholder')}
                value={practiceInput}
                onChange={onPracticeInputChange}
              />
              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                startIcon={<SendRoundedIcon />}
                disabled={!isAuthorized || isBootstrapping || isPracticePending}
              >
                {isPracticePending ? t('practice.sending') : t('practice.send')}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {practiceResult ? (
        <Card>
          <CardContent>
            <Stack
              component="div"
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {t('practice.assistantReply')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${practiceResult.language.toUpperCase()} / ${formatMode(practiceResult.mode)}`}
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
              {practiceResult.reply_text}
            </Typography>
            <Alert severity="info" variant="outlined">
              {[
                practiceResult.feedback_summary
                  ? t('practice.feedback', { summary: practiceResult.feedback_summary })
                  : null,
                t('practice.mistakesDetected', { count: practiceResult.mistakes_detected }),
              ]
                .filter(Boolean)
                .join(' | ')}
            </Alert>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
};
