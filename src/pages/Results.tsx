import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Home, Eye, CheckCircle, XCircle, MinusCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ExamResult, ExamAttempt, Test } from '@/types/exam';

const Results = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!attemptId) return;

      const { data: resultData } = await supabase
        .from('exam_results')
        .select('*')
        .eq('attempt_id', attemptId)
        .single();

      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attemptData) {
        const { data: testData } = await supabase
          .from('tests')
          .select('*')
          .eq('id', attemptData.test_id)
          .single();

        setTest(testData);
      }

      setResult(resultData);
      setAttempt(attemptData);
      setIsLoading(false);
    };

    fetchResults();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!result || !attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Results not found</p>
      </div>
    );
  }

  const percentage = (result.total_score / result.max_score) * 100;
  const accuracy = result.correct_count / (result.correct_count + result.incorrect_count) * 100 || 0;
  const timeSpent = attempt.duration_spent_seconds || 0;
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

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
                <h1 className="text-xl font-bold text-foreground">Exam Results</h1>
                <p className="text-sm text-muted-foreground">{test?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={`/solutions/${attemptId}`}>
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View Solutions
                </Button>
              </Link>
              <Link to="/">
                <Button className="gap-2">
                  <Home className="w-4 h-4" />
                  Back to Tests
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Score Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Score Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-primary mb-2">
                {result.total_score.toFixed(2)}
              </div>
              <div className="text-muted-foreground">
                out of {result.max_score} marks
              </div>
              <Progress value={Math.max(0, percentage)} className="mt-4 h-3" />
              <div className="text-sm text-muted-foreground mt-2">
                {percentage.toFixed(1)}% Score
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{result.correct_count}</div>
                  <div className="text-sm text-muted-foreground">Correct (+{result.correct_count})</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{result.incorrect_count}</div>
                  <div className="text-sm text-muted-foreground">Incorrect (-{(result.incorrect_count * 0.25).toFixed(2)})</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <MinusCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{result.unanswered_count}</div>
                  <div className="text-sm text-muted-foreground">
                    Unanswered (-{(Math.max(0, result.unanswered_count - 8) * 0.10).toFixed(2)})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Spent</span>
                  <span className="font-medium">{minutes}m {seconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Allocated</span>
                  <span className="font-medium">{attempt.duration_allocated_minutes}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submission Type</span>
                  <span className={`font-medium ${attempt.is_timeout ? 'text-warning' : 'text-success'}`}>
                    {attempt.is_timeout ? 'Auto-submitted' : 'Manual'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scoring Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correct × 1</span>
                  <span className="font-medium text-success">+{result.correct_count}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Incorrect × 0.25</span>
                  <span className="font-medium text-destructive">-{(result.incorrect_count * 0.25).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unanswered after 8 × 0.10</span>
                  <span className="font-medium text-muted-foreground">
                    -{(Math.max(0, result.unanswered_count - 8) * 0.10).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total Score</span>
                  <span className="text-primary">{result.total_score.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Results;
