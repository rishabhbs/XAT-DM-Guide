import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useExamStore } from '@/hooks/useExamStore';
import { Timer } from '@/components/Timer';
import { QuestionPalette } from '@/components/QuestionPalette';
import { QuestionPanel } from '@/components/QuestionPanel';
import { InstructionsPanel } from '@/components/InstructionsPanel';
import { Button } from '@/components/ui/button';
import { BookOpen, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Question, Test } from '@/types/exam';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Exam = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    setAttempt, 
    attemptId, 
    questions, 
    responses, 
    setSubmitted, 
    isSubmitted,
    resetExam,
    timeRemaining
  } = useExamStore();

  useEffect(() => {
    const initializeExam = async () => {
      if (!testId) return;

      // Fetch test details
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError || !testData) {
        toast({
          title: 'Error',
          description: 'Test not found',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setTest(testData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('question_number', { ascending: true });

      if (questionsError || !questionsData) {
        toast({
          title: 'Error',
          description: 'Failed to load questions',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Create exam attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          test_id: testId,
          duration_allocated_minutes: testData.duration_minutes,
        })
        .select()
        .single();

      if (attemptError || !attemptData) {
        toast({
          title: 'Error',
          description: 'Failed to start exam',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setAttempt(
        attemptData.id,
        testId,
        questionsData as Question[],
        testData.duration_minutes
      );
      setIsLoading(false);
    };

    initializeExam();

    return () => {
      resetExam();
    };
  }, [testId]);

  const calculateScore = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((question) => {
      const response = responses.get(question.id);
      if (!response?.selected_answer) {
        unanswered++;
      } else if (response.selected_answer === question.correct_answer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    // XAT scoring: +1 for correct, -0.25 for incorrect, -0.10 for unanswered after first 8
    const unansweredPenalty = Math.max(0, unanswered - 8) * 0.10;
    const totalScore = correct - (incorrect * 0.25) - unansweredPenalty;
    const maxScore = questions.length;

    return { correct, incorrect, unanswered, totalScore, maxScore };
  };

  const handleSubmit = async (isTimeout: boolean = false) => {
    if (!attemptId) return;

    setIsSubmitting(true);
    setShowSubmitDialog(false);

    try {
      const { correct, incorrect, unanswered, totalScore, maxScore } = calculateScore();

      // Save all responses
      const responsesToSave = Array.from(responses.entries()).map(([questionId, response]) => ({
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer: response.selected_answer,
        is_marked_for_review: response.is_marked_for_review,
        time_spent_seconds: response.time_spent_seconds,
      }));

      const { error: responsesError } = await supabase
        .from('exam_responses')
        .upsert(responsesToSave, { onConflict: 'attempt_id,question_id' });

      if (responsesError) throw responsesError;

      // Update attempt
      const durationSpent = test ? (test.duration_minutes * 60) - timeRemaining : 0;
      const { error: attemptError } = await supabase
        .from('exam_attempts')
        .update({
          end_time: new Date().toISOString(),
          duration_spent_seconds: durationSpent,
          is_submitted: true,
          is_timeout: isTimeout,
        })
        .eq('id', attemptId);

      if (attemptError) throw attemptError;

      // Save results
      const { error: resultsError } = await supabase
        .from('exam_results')
        .insert({
          attempt_id: attemptId,
          correct_count: correct,
          incorrect_count: incorrect,
          unanswered_count: unanswered,
          total_score: totalScore,
          max_score: maxScore,
        });

      if (resultsError) throw resultsError;

      setSubmitted();

      toast({
        title: isTimeout ? 'Time Up!' : 'Exam Submitted',
        description: 'Your exam has been submitted successfully.',
      });

      navigate(`/results/${attemptId}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit exam',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmit(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">{test?.name}</span>
        </div>

        <Timer onTimeUp={handleTimeUp} />

        <Button
          onClick={() => setShowSubmitDialog(true)}
          disabled={isSubmitted || isSubmitting}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Submit Exam
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Instructions Panel - 40% */}
        <div className="w-[40%] border-r border-border exam-panel overflow-hidden">
          <InstructionsPanel />
        </div>

        {/* Questions Panel - 40% */}
        <div className="w-[40%] border-r border-border exam-panel overflow-hidden">
          <QuestionPanel />
        </div>

        {/* Palette Panel - 20% */}
        <div className="w-[20%] exam-panel overflow-hidden">
          <QuestionPalette />
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Submit Exam?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Are you sure you want to submit your exam?</p>
                <div className="p-3 bg-secondary rounded-lg text-sm">
                  <p>Answered: {Array.from(responses.values()).filter(r => r.selected_answer).length}</p>
                  <p>Unanswered: {questions.length - Array.from(responses.values()).filter(r => r.selected_answer).length}</p>
                  <p>Marked for Review: {Array.from(responses.values()).filter(r => r.is_marked_for_review).length}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(false)}>
              Submit Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Exam;
