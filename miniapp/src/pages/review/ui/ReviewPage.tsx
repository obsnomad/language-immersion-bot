import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { ReviewSection } from '@/widgets/review-section/ui/ReviewSection';

export const ReviewPage = () => {
  const { handleRefreshReview, isAuthorized, isBootstrapping, isReviewPending, reviewItems } =
    useLayoutContext();

  return (
    <ReviewSection
      reviewItems={reviewItems}
      isAuthorized={isAuthorized}
      isReviewPending={isReviewPending}
      isBootstrapping={isBootstrapping}
      onRefresh={handleRefreshReview}
    />
  );
};
