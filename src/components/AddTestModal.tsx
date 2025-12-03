import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { parseCSV, validateCSV } from '@/lib/csv-parser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CSVQuestion } from '@/types/exam';

interface AddTestModalProps {
  onTestAdded: () => void;
}

export function AddTestModal({ onTestAdded }: AddTestModalProps) {
  const [open, setOpen] = useState(false);
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState(40);
  const [year, setYear] = useState<number | ''>('');
  const [fileName, setFileName] = useState('');
  const [questions, setQuestions] = useState<CSVQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const validationErrors = validateCSV(parsed);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setQuestions([]);
      } else {
        setQuestions(parsed);
        if (!testName) {
          setTestName(file.name.replace(/\.csv$/i, ''));
        }
      }
    } catch (err) {
      setErrors([`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`]);
      setQuestions([]);
    }
  };

  const handleSubmit = async () => {
    if (!testName.trim() || questions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a test name and upload a valid CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert({
          name: testName.trim(),
          question_count: questions.length,
          duration_minutes: duration,
          year: year || null,
        })
        .select()
        .single();

      if (testError) throw testError;

      const questionsToInsert = questions.map((q, index) => ({
        test_id: testData.id,
        question_number: parseInt(q.question_number) || index + 1,
        question_text: q.question_text,
        set_name: q.set_name || null,
        passage_text: q.passage_text || null,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: 'Test Created',
        description: `Successfully imported ${questions.length} questions.`,
      });

      setOpen(false);
      resetForm();
      onTestAdded();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create test',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTestName('');
    setDuration(40);
    setYear('');
    setFileName('');
    setQuestions([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Testes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import New Test</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., XAT 2025 DM Section"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 40)}
                min={1}
                max={180}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="year">Year (optional)</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="2025"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>CSV File</Label>
            <div
              className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <FileText className="w-5 h-5" />
                  <span>{fileName}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p>Click to upload CSV file</p>
                  <p className="text-xs mt-1">or drag and drop</p>
                </div>
              )}
            </div>
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                Validation Errors
              </div>
              <ul className="text-sm text-destructive/80 space-y-1">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {errors.length > 5 && (
                  <li>...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          {questions.length > 0 && errors.length === 0 && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 text-success font-medium">
                <CheckCircle className="w-4 h-4" />
                {questions.length} questions parsed successfully
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || questions.length === 0 || errors.length > 0}
            >
              {isLoading ? 'Importing...' : 'Import Test'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
