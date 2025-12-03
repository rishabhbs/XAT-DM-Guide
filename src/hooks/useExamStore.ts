import { create } from 'zustand';
import { Question, ExamResponse, QuestionStatus } from '@/types/exam';

interface ExamState {
  attemptId: string | null;
  testId: string | null;
  questions: Question[];
  responses: Map<string, ExamResponse>;
  visitedQuestions: Set<string>;
  currentQuestionIndex: number;
  timeRemaining: number;
  isSubmitted: boolean;
  zoomLevel: number;

  setAttempt: (attemptId: string, testId: string, questions: Question[], durationMinutes: number) => void;
  setResponse: (questionId: string, response: Partial<ExamResponse>) => void;
  markVisited: (questionId: string) => void;
  clearSelection: (questionId: string) => void;
  setCurrentQuestion: (index: number) => void;
  decrementTime: () => void;
  setSubmitted: () => void;
  setZoomLevel: (level: number) => void;
  getQuestionStatus: (questionId: string) => QuestionStatus;
  resetExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  attemptId: null,
  testId: null,
  questions: [],
  responses: new Map(),
  visitedQuestions: new Set(),
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isSubmitted: false,
  zoomLevel: 100,

  setAttempt: (attemptId, testId, questions, durationMinutes) => {
    const responses = new Map<string, ExamResponse>();
    questions.forEach(q => {
      responses.set(q.id, {
        id: '',
        attempt_id: attemptId,
        question_id: q.id,
        selected_answer: null,
        is_marked_for_review: false,
        time_spent_seconds: 0,
      });
    });
    set({
      attemptId,
      testId,
      questions,
      responses,
      currentQuestionIndex: 0,
      timeRemaining: durationMinutes * 60,
      isSubmitted: false,
    });
  },

  setResponse: (questionId, update) => {
    const { responses } = get();
    const current = responses.get(questionId);
    if (current) {
      const updated = new Map(responses);
      updated.set(questionId, { ...current, ...update });
      set({ responses: updated });
    }
  },

  markVisited: (questionId) => {
    const { visitedQuestions } = get();
    const updated = new Set(visitedQuestions);
    updated.add(questionId);
    set({ visitedQuestions: updated });
  },

  clearSelection: (questionId) => {
    const { responses } = get();
    const current = responses.get(questionId);
    if (current) {
      const updated = new Map(responses);
      updated.set(questionId, { ...current, selected_answer: null });
      set({ responses: updated });
    }
  },

  setCurrentQuestion: (index) => {
    const { questions } = get();
    if (questions[index]) {
      get().markVisited(questions[index].id);
    }
    set({ currentQuestionIndex: index });
  },

  decrementTime: () => {
    const { timeRemaining } = get();
    if (timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  setSubmitted: () => set({ isSubmitted: true }),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(80, Math.min(150, level)) }),

  getQuestionStatus: (questionId) => {
    const { responses, visitedQuestions } = get();
    const response = responses.get(questionId);
    if (!response) return 'unanswered';
    if (response.is_marked_for_review) return 'marked';
    if (response.selected_answer) return 'answered';
    if (visitedQuestions.has(questionId)) return 'visited';
    return 'unanswered';
  },

  resetExam: () => set({
    attemptId: null,
    testId: null,
    questions: [],
    responses: new Map(),
    visitedQuestions: new Set(),
    currentQuestionIndex: 0,
    timeRemaining: 0,
    isSubmitted: false,
    zoomLevel: 100,
  }),
}));
