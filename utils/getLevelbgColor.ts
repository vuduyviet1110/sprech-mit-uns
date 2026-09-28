export function getLevelStyle(code: string) {
  switch (code) {
    case 'A1':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
        text: 'text-blue-700 dark:text-blue-300',
      }
    case 'A2':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800',
        hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
        text: 'text-amber-700 dark:text-amber-300',
      }
    case 'B1':
      return {
        bg: 'bg-primary-50 dark:bg-primary-900/30',
        border: 'border-primary-200 dark:border-primary-800',
        hover: 'hover:bg-primary-100 dark:hover:bg-primary-900/40',
        text: 'text-primary-700 dark:text-primary-300',
      }
    case 'B2':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        border: 'border-slate-300 dark:border-slate-600',
        hover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
        text: 'text-slate-800 dark:text-slate-200',
      }
    case 'C1':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
        text: 'text-emerald-700 dark:text-emerald-300',
      }
    case 'C2':
      return {
        bg: 'bg-blue-100 dark:bg-blue-950/50',
        border: 'border-blue-300 dark:border-blue-700',
        hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/40',
        text: 'text-blue-800 dark:text-blue-200',
      }
    default:
      return {
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800',
        hover: 'hover:bg-slate-50 dark:hover:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
      }
  }
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Easy':
      return 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
    case 'Medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'Hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  }
}

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'noun':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
    case 'verb':
      return 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
    case 'adjective':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}
