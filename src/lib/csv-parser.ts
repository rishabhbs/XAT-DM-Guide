import { CSVQuestion } from '@/types/exam';

export function parseCSV(csvText: string): CSVQuestion[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const questions: CSVQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
    });

    const question: CSVQuestion = {
      question_number: row.question_number || String(i),
      question_text: row.question_text || '',
      passage_text: row.passage_text || '',
      option_a: row.option_a || '',
      option_b: row.option_b || '',
      option_c: row.option_c || '',
      option_d: row.option_d || '',
      option_e: row.option_e || '',
      correct_answer: row.correct_answer?.toUpperCase() || '',
      set_name: row.set_name || '',
      explanation: row.explanation || '',
    };

    if (question.question_text && question.correct_answer) {
      questions.push(question);
    }
  }

  return questions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function validateCSV(questions: CSVQuestion[]): string[] {
  const errors: string[] = [];
  
  questions.forEach((q, index) => {
    if (!q.question_text) {
      errors.push(`Row ${index + 2}: Missing question text`);
    }
    if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      errors.push(`Row ${index + 2}: Missing required options (A-D)`);
    }
    if (!['A', 'B', 'C', 'D', 'E'].includes(q.correct_answer)) {
      errors.push(`Row ${index + 2}: Invalid correct answer "${q.correct_answer}"`);
    }
  });

  return errors;
}
