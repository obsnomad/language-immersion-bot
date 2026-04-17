import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';
import { RepeatWordsSection } from '@/widgets/repeat-words/ui/RepeatWordsSection';

export const RepeatWordsPage = () => {
  const { isAuthorized, reviewItems } = useLayoutContext();

  return <RepeatWordsSection reviewItems={reviewItems} isAuthorized={isAuthorized} />;
};
