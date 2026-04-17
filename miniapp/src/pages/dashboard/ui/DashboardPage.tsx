import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { ProgressSnapshotSection } from '@/widgets/progress-snapshot/ui/ProgressSnapshotSection';
import { RecentSessionsSection } from '@/widgets/recent-sessions/ui/RecentSessionsSection';
import { Grid } from '@mui/material';

export const DashboardPage = () => {
  const { isAuthorized, summary } = useLayoutContext();

  return (
    <>
      <ProgressSnapshotSection summary={summary} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <RecentSessionsSection
            recentSessions={summary.recent_sessions}
            isAuthorized={isAuthorized}
          />
        </Grid>
      </Grid>
    </>
  );
};
