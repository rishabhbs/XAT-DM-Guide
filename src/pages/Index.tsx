import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Test } from '@/types/exam';
import { TestCard } from '@/components/TestCard';
import { AddTestModal } from '@/components/AddTestModal';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const Index = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchTests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tests',
        variant: 'destructive',
      });
    } else {
      setTests(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartTest = async (testId: string) => {
    navigate(`/exam/${testId}`);
  };

  const handleDeleteTest = async () => {
    if (!deleteTestId) return;

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', deleteTestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Test Deleted',
        description: 'The test has been removed.',
      });
      fetchTests();
    }
    setDeleteTestId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">XAT DM Practice</h1>
                <p className="text-sm text-muted-foreground">Decision Making Question Bank</p>
              </div>
            </div>
            <AddTestModal onTestAdded={fetchTests} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Tests Available</h2>
            <p className="text-muted-foreground mb-4">
              Import your first test by clicking "Add New Test" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onStart={handleStartTest}
                onDelete={setDeleteTestId}
              />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteTestId} onOpenChange={() => setDeleteTestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test and all associated questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
