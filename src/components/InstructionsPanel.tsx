import { useExamStore } from '@/hooks/useExamStore';
import { ZoomIn, ZoomOut, FileText } from 'lucide-react';

export function InstructionsPanel() {
  const { questions, currentQuestionIndex, zoomLevel, setZoomLevel } = useExamStore();
  const question = questions[currentQuestionIndex];

  return (
    <div className="h-full flex flex-col" style={{ fontSize: `${zoomLevel}%` }}>
      <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {question?.passage_text ? 'Scenario' : 'Instructions'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(zoomLevel - 10)}
            className="zoom-btn"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground w-12 text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(zoomLevel + 10)}
            className="zoom-btn"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {question?.passage_text ? (
          <div className="prose prose-sm max-w-none">
            {question.set_name && (
              <div className="mb-4 px-3 py-1.5 bg-accent/20 border border-accent/30 rounded inline-block">
                <span className="text-xs font-medium text-foreground">Set: {question.set_name}</span>
              </div>
            )}
            <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
              <h4 className="text-base font-semibold text-foreground mb-3">Passage</h4>
              <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                <div dangerouslySetInnerHTML={{ __html: question.passage_text }} />
              </div>
            </div>
          </div>
        ) : question?.set_name ? (
          <div className="prose prose-sm max-w-none">
            <h4 className="text-lg font-semibold text-foreground mb-4">{question.set_name}</h4>
            <div className="text-muted-foreground space-y-4">
              <p>
                This question is part of a set. Read the context carefully before answering.
              </p>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="font-medium text-foreground">Set: {question.set_name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <h4 className="text-lg font-semibold text-foreground mb-4">General Instructions</h4>
            <ul className="space-y-2">
              <li>Read each question carefully before selecting your answer.</li>
              <li>You can navigate between questions using the palette on the right.</li>
              <li>Mark questions for review if you want to revisit them later.</li>
              <li>Click "Save & Next" to save your answer and move to the next question.</li>
              <li>The exam will auto-submit when the timer reaches zero.</li>
            </ul>
            <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <h5 className="font-semibold text-warning mb-2">Scoring Formula</h5>
              <ul className="text-sm space-y-1">
                <li>Correct Answer: +1 mark</li>
                <li>Incorrect Answer: -0.25 marks</li>
                <li>Unanswered (after first 8): -0.10 marks</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
