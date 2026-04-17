import type { RecentSession } from '@/shared/api';
import { useAppI18n } from '@/shared/i18n/useAppI18n';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import {
  Avatar,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

interface RecentSessionsSectionProps {
  recentSessions: RecentSession[];
  isAuthorized: boolean;
}

export const RecentSessionsSection = ({
  recentSessions,
  isAuthorized,
}: RecentSessionsSectionProps) => {
  const { formatDateTime, formatMode, t } = useAppI18n();

  return (
    <Card>
      <CardContent>
        <Stack component="div" direction="row" sx={{ mb: 1.5 }}>
          <div>
            <Typography variant="h6">{t('recent.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('recent.subtitle')}
            </Typography>
          </div>
        </Stack>

        {!recentSessions.length ? (
          <Typography color="text.secondary">
            {isAuthorized ? t('recent.empty.authorized') : t('recent.empty.unauthorized')}
          </Typography>
        ) : (
          <List>
            {recentSessions.map((sessionItem) => (
              <ListItem key={sessionItem.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <TranslateRoundedIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={formatMode(sessionItem.mode)}
                  secondary={
                    <Stack component="div" direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <AccessTimeRoundedIcon fontSize="inherit" />
                      <span>{formatDateTime(sessionItem.started_at)}</span>
                    </Stack>
                  }
                />
                <Chip label={sessionItem.language.toUpperCase()} size="small" color="primary" />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
