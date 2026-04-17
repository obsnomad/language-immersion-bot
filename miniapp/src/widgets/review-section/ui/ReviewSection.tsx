import type { ReviewItem } from '@/shared/api';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

interface ReviewSectionProps {
  reviewItems: ReviewItem[];
  isAuthorized: boolean;
  isReviewPending: boolean;
  isBootstrapping: boolean;
  onRefresh: () => void;
}

export const ReviewSection = ({
  reviewItems,
  isAuthorized,
  isReviewPending,
  isBootstrapping,
  onRefresh,
}: ReviewSectionProps) => {
  const { formatCategory, t } = useAppI18n();

  return (
    <Card>
      <CardContent>
        <Stack component="div" direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
          <div>
            <Typography variant="h6">{t('review.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('review.subtitle')}
            </Typography>
          </div>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={onRefresh}
            disabled={!isAuthorized || isReviewPending || isBootstrapping}
          >
            {isReviewPending ? t('review.refreshing') : t('review.refresh')}
          </Button>
        </Stack>

        {!reviewItems.length ? (
          <Alert severity={isAuthorized ? 'success' : 'warning'} variant="outlined">
            {isAuthorized ? t('review.empty.authorized') : t('review.empty.unauthorized')}
          </Alert>
        ) : (
          <List>
            {reviewItems.map((item) => (
              <ListItem key={item.id}>
                <ListItemText
                  primary={
                    <Stack component="div" direction="row" spacing={1} sx={{ mb: 0.75 }}>
                      <Typography variant="subtitle1">{item.source_text}</Typography>
                      <Chip
                        label={t('review.severity', { count: item.severity })}
                        color={item.severity >= 3 ? 'warning' : 'primary'}
                        size="small"
                      />
                    </Stack>
                  }
                  secondary={
                    <Stack component="div" spacing={0.75}>
                      <Typography variant="body2" color="text.primary">
                        {t('review.fix', { correction: item.correction })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.explanation}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${item.language.toUpperCase()} | ${formatCategory(item.category)}`}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
