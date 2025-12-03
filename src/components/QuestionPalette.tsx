import { useExamStore } from '@/hooks/useExamStore';
import { cn } from '@/lib/utils';

export function QuestionPalette() {
  const { questions, currentQuestionIndex, setCurrentQuestion, getQuestionStatus, responses } = useExamStore();

  const answeredCount = Array.from(responses.values()).filter(r => r.selected_answer).length;
  const markedCount = Array.from(responses.values()).filter(r => r.is_marked_for_review).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground mb-3">Question Palette</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-success" />
            <span className="text-muted-foreground">Answered: {answeredCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-muted border border-border" />
            <span className="text-muted-foreground">Unanswered: {unansweredCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-visited" />
            <span className="text-muted-foreground">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-review" />
            <span className="text-muted-foreground">Marked: {markedCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question.id);
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={question.id}
                onClick={() => setCurrentQuestion(index)}
                className={cn(
                  'question-btn',
                  status === 'unanswered' && 'question-btn-unanswered',
                  status === 'visited' && 'question-btn-visited',
                  status === 'answered' && 'question-btn-answered',
                  status === 'marked' && 'question-btn-marked',
                  isCurrent && 'question-btn-current'
                )}
              >
                {question.question_number}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
