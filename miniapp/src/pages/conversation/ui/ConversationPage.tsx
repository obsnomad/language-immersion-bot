import { PracticeSection } from '@/features/practice-message/ui/PracticeSection';
import { useLayoutContext } from '@/shared/ui/layout/LayoutContext';

export const ConversationPage = () => {
  const {
    handleSubmitPractice,
    isAuthorized,
    isBootstrapping,
    isPracticePending,
    practiceInput,
    practiceResult,
    setPracticeInput,
  } = useLayoutContext();

  return (
    <PracticeSection
      practiceInput={practiceInput}
      onPracticeInputChange={(event) => setPracticeInput(event.target.value)}
      onSubmit={handleSubmitPractice}
      isPracticePending={isPracticePending}
      isAuthorized={isAuthorized}
      isBootstrapping={isBootstrapping}
      practiceResult={practiceResult}
    />
  );
};
