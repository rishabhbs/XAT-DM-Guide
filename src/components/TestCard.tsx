import { Test } from '@/types/exam';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileQuestion, Calendar, Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TestCardProps {
  test: Test;
  onStart: (testId: string) => void;
  onDelete: (testId: string) => void;
}

export function TestCard({ test, onStart, onDelete }: TestCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="text-lg">{test.name}</span>
          {test.year && (
            <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
              {test.year}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4" />
            <span>{test.question_count} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{test.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Added {format(new Date(test.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={() => onStart(test.id)} className="flex-1 gap-2">
          <Play className="w-4 h-4" />
          Start Test
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(test.id)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
