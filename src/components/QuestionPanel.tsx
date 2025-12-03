import { useState, useEffect } from 'react';
import { useExamStore } from '@/hooks/useExamStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, Flag, Save, X } from 'lucide-react';

interface QuestionPanelProps {
  isReview?: boolean;
}

export function QuestionPanel({ isReview = false }: QuestionPanelProps) {
  const { 
    questions, 
    currentQuestionIndex, 
    setCurrentQuestion, 
    responses, 
    setResponse,
    clearSelection,
    zoomLevel,
    isSubmitted
  } = useExamStore();

  const question = questions[currentQuestionIndex];
  const response = responses.get(question.id);
  
  // Local state for temporary selection (not saved until "Save & Next")
  const [tempSelection, setTempSelection] = useState<string | null>(null);

  // Update temp selection when question changes
  useEffect(() => {
    setTempSelection(response?.selected_answer || null);
  }, [question.id, response?.selected_answer]);

  if (!question) return null;
  const options = [
    { key: 'A', value: question.option_a },
    { key: 'B', value: question.option_b },
    { key: 'C', value: question.option_c },
    { key: 'D', value: question.option_d },
    ...(question.option_e ? [{ key: 'E', value: question.option_e }] : []),
  ];

  const handleOptionSelect = (optionKey: string) => {
    if (isSubmitted || isReview) return;
    // Only update local state, don't save to database yet
    setTempSelection(optionKey);
  };

  const handleClearSelection = () => {
    if (isSubmitted || isReview) return;
    // Clear both temp selection and saved selection
    setTempSelection(null);
    clearSelection(question.id);
  };

  const handleMarkForReview = () => {
    if (isSubmitted || isReview) return;
    // Save current selection if any, then mark for review
    if (tempSelection) {
      setResponse(question.id, { selected_answer: tempSelection, is_marked_for_review: true });
    } else {
      setResponse(question.id, { is_marked_for_review: !response?.is_marked_for_review });
    }
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const handleSaveAndNext = () => {
    if (isSubmitted || isReview) return;
    // Save current selection to database
    if (tempSelection) {
      setResponse(question.id, { selected_answer: tempSelection, is_marked_for_review: false });
    }
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const getOptionClass = (optionKey: string) => {
    if (isReview) {
      if (optionKey === question.correct_answer) return 'option-radio-correct';
      if (optionKey === response?.selected_answer && optionKey !== question.correct_answer) {
        return 'option-radio-incorrect';
      }
    }
    // Use temp selection for UI state
    if (tempSelection === optionKey) return 'option-radio-selected';
    return '';
  };

  return (
    <div className="h-full flex flex-col" style={{ fontSize: `${zoomLevel}%` }}>
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">
            Question {question.question_number} of {questions.length}
          </span>
          {(response?.is_marked_for_review || tempSelection && response?.is_marked_for_review) && (
            <span className="px-2 py-1 text-xs font-medium bg-review text-review-foreground rounded">
              Marked for Review
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        <div className="prose prose-sm max-w-none mb-6">
          
          <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
        </div>

        <div className="space-y-3">
          {options.map((option) => (
            <label
              key={option.key}
              className={cn(
                'option-radio',
                getOptionClass(option.key),
                (isSubmitted || isReview) && 'cursor-default'
              )}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={tempSelection === option.key}
                onChange={() => handleOptionSelect(option.key)}
                disabled={isSubmitted || isReview}
                className="mt-1 w-4 h-4 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div
                  className="text-foreground" dangerouslySetInnerHTML={{ __html: option.value }}/>
              </div>
            </label>
          ))}
        </div>

        {isReview && question.explanation && (
          <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
            <h4 className="font-semibold text-success mb-2">Explanation</h4>
            <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
          </div>
        )}
      </div>

      {!isReview && (
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleClearSelection}
              disabled={isSubmitted || (!tempSelection && !response?.selected_answer)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear Selection
            </Button>

            <Button
              variant={response?.is_marked_for_review ? 'default' : 'outline'}
              onClick={handleMarkForReview}
              disabled={isSubmitted}
              className={cn('gap-2', response?.is_marked_for_review && 'bg-review hover:bg-review/90')}
            >
              <Flag className="w-4 h-4" />
              {response?.is_marked_for_review ? 'Marked' : 'Mark for Review'}
            </Button>

            
            <Button
              onClick={() => {handleSaveAndNext();
              if (currentQuestionIndex < questions.length - 1) {setCurrentQuestion(currentQuestionIndex + 1);}
              }}
              disabled={isSubmitted} // disable only if submitted, not on last question
              className="gap-2"
              >
              <Save className="w-4 h-4" />
              {currentQuestionIndex === questions.length - 1 ? 'Save' : 'Save & Next'}
                {currentQuestionIndex !== questions.length - 1 && (
              <ChevronRight className="w-4 h-4" />
              )}
            </Button>

          </div>
        </div>
      )}
    </div>
  );
}
