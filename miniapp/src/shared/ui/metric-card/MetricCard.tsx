import { Card, CardContent, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

type MetricTone = 'primary' | 'warning' | 'success';

interface MetricCardProps {
  label: string;
  value: string | number;
  tone: MetricTone;
}

export const MetricCard = ({ label, value, tone }: MetricCardProps) => {
  const theme = useTheme();
  const accent = {
    primary: theme.palette.primary.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
  }[tone];

  return (
    <Card
      sx={{
        minHeight: 132,
        border: '1px solid',
        borderColor: alpha(accent, 0.22),
        background: `linear-gradient(180deg, ${alpha(accent, 0.12)} 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h3">{String(value)}</Typography>
      </CardContent>
    </Card>
  );
};
