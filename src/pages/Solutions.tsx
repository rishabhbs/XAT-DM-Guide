import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Home, ChevronLeft, ChevronRight, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { Question, ExamResponse, Test } from '@/types/exam';
import { cn } from '@/lib/utils';

const Solutions = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Map<string, ExamResponse>>(new Map());
  const [test, setTest] = useState<Test | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!attemptId) return;

      // Get attempt to find test_id
      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .select('test_id')
        .eq('id', attemptId)
        .single();

      if (!attemptData) return;

      // Get test details
      const { data: testData } = await supabase
        .from('tests')
        .select('*')
        .eq('id', attemptData.test_id)
        .single();

      setTest(testData);

      // Get questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', attemptData.test_id)
        .order('question_number', { ascending: true });

      setQuestions(questionsData || []);

      // Get responses
      const { data: responsesData } = await supabase
        .from('exam_responses')
        .select('*')
        .eq('attempt_id', attemptId);

      const responsesMap = new Map<string, ExamResponse>();
      responsesData?.forEach((r) => {
        responsesMap.set(r.question_id, r as ExamResponse);
      });
      setResponses(responsesMap);

      setIsLoading(false);
    };

    fetchData();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const response = question ? responses.get(question.id) : null;

  const getStatus = () => {
    if (!response?.selected_answer) return 'unanswered';
    if (response.selected_answer === question?.correct_answer) return 'correct';
    return 'incorrect';
  };

  const status = getStatus();

  const options = question ? [
    { key: 'A', value: question.option_a },
    { key: 'B', value: question.option_b },
    { key: 'C', value: question.option_c },
    { key: 'D', value: question.option_d },
    ...(question.option_e ? [{ key: 'E', value: question.option_e }] : []),
  ] : [];

  const getOptionClass = (optionKey: string) => {
    if (optionKey === question?.correct_answer) return 'option-radio-correct';
    if (optionKey === response?.selected_answer && optionKey !== question?.correct_answer) {
      return 'option-radio-incorrect';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Solution Review</h1>
                <p className="text-sm text-muted-foreground">{test?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={`/results/${attemptId}`}>
                <Button variant="outline">Back to Results</Button>
              </Link>
              <Link to="/">
                <Button className="gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Questions</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const r = responses.get(q.id);
                    let statusClass = 'question-btn-unanswered';
                    if (r?.selected_answer === q.correct_answer) {
                      statusClass = 'question-btn-answered';
                    } else if (r?.selected_answer) {
                      statusClass = 'bg-destructive text-destructive-foreground border-destructive';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                          'question-btn',
                          statusClass,
                          index === currentIndex && 'question-btn-current'
                        )}
                      >
                        {q.question_number}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-success" />
                    <span className="text-muted-foreground">Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-destructive" />
                    <span className="text-muted-foreground">Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-muted border border-border" />
                    <span className="text-muted-foreground">Unanswered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Detail */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">
                    Question {question?.question_number} of {questions.length}
                  </span>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                    status === 'correct' && 'bg-success/10 text-success',
                    status === 'incorrect' && 'bg-destructive/10 text-destructive',
                    status === 'unanswered' && 'bg-muted text-muted-foreground'
                  )}>
                    {status === 'correct' && <CheckCircle className="w-4 h-4" />}
                    {status === 'incorrect' && <XCircle className="w-4 h-4" />}
                    {status === 'unanswered' && <MinusCircle className="w-4 h-4" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                </div>

                {/* Passage Text (if available) */}
                {question?.passage_text && (
                  <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                    {question.set_name && (
                      <div className="mb-3 px-2 py-1 bg-accent/20 border border-accent/30 rounded inline-block">
                        <span className="text-xs font-medium text-foreground">Set: {question.set_name}</span>
                      </div>
                    )}
                    <h4 className="text-base font-semibold text-foreground mb-2">Passage</h4>
                    <p className="text-foreground leading-relaxed text-sm">
                      <span dangerouslySetInnerHTML={{ __html: question.passage_text }}/>
                    </p>

                  </div>
                )}

                {/* Question Text */}
                <div className="prose prose-sm max-w-none mb-6">
                <p className="text-foreground leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: question?.question_text || '' }}/>
                </p>
                </div>


                {/* Options */}
                <div className="space-y-3 mb-6">
                  {options.map((option) => (
                    <div
                      key={option.key}
                      className={cn(
                        'option-radio cursor-default',
                        getOptionClass(option.key)
                      )}
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-foreground mr-2">({option.key})</span>
                        {/* <span dangerouslySetInnerHTML={{ __html: question?.question_text || '' }}/> */}
                        <span className="text-foreground" dangerouslySetInnerHTML={{ __html: option.value }}/>
                       
                        {option.key === question?.correct_answer && (
                          <span className="ml-2 text-success font-medium">✓ Correct</span>
                        )}
                        {option.key === response?.selected_answer && option.key !== question?.correct_answer && (
                          <span className="ml-2 text-destructive font-medium">✗ Your answer</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {question?.explanation && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <h4 className="font-semibold text-success mb-2">Explanation</h4>
                    <p className="text-foreground">
                      <span dangerouslySetInnerHTML={{ __html: question.explanation }}/>
                    </p>

                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Solutions;
