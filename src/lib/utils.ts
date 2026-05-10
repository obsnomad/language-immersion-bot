import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function modeLabel(mode: string | null): string {
  const labels: Record<string, string> = {
    conversation: 'Conversation',
    scenario: 'Scenario',
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    writing: 'Writing',
    exam: 'Exam',
    review: 'Review',
  };
  return mode ? (labels[mode] ?? mode) : 'General';
}

export function languageLabel(lang: string): string {
  const labels: Record<string, string> = { en: 'English', es: 'Spanish', sr: 'Serbian' };
  return labels[lang] ?? lang.toUpperCase();
}

export function severityColor(severity: number): 'error' | 'warning' | 'default' {
  if (severity >= 4) return 'error';
  if (severity >= 2) return 'warning';
  return 'default';
}
