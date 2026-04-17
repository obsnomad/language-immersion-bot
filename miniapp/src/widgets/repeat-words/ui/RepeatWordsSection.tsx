import type { ReviewItem } from '@/shared/api';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import {
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

interface RepeatWordsSectionProps {
  reviewItems: ReviewItem[];
  isAuthorized: boolean;
}

const buildRepeatEntries = (reviewItems: ReviewItem[]) =>
  reviewItems
    .map((item) => ({
      id: item.id,
      source: item.source_text.trim(),
      correction: item.correction.trim(),
      nextReviewAt: item.next_review_at,
    }))
    .filter((item) => item.correction.length > 0);

export const RepeatWordsSection = ({ reviewItems, isAuthorized }: RepeatWordsSectionProps) => {
  const { formatDateTime, t } = useAppI18n();
  const repeatEntries = buildRepeatEntries(reviewItems);

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {t('repeat.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('repeat.subtitle')}
        </Typography>

        {!repeatEntries.length ? (
          <Alert severity={isAuthorized ? 'success' : 'warning'} variant="outlined">
            {isAuthorized
              ? t('repeat.empty.authorized')
              : t('repeat.empty.unauthorized')}
          </Alert>
        ) : (
          <List>
            {repeatEntries.map((entry) => (
              <ListItem key={entry.id}>
                <ListItemAvatar>
                  <RecordVoiceOverRoundedIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary={entry.correction}
                  secondary={[
                    entry.source ? t('repeat.from', { source: entry.source }) : null,
                    entry.nextReviewAt
                      ? t('repeat.nextReview', { date: formatDateTime(entry.nextReviewAt) })
                      : t('repeat.availableNow'),
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                />
                <Chip label={`#${entry.id}`} size="small" />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
