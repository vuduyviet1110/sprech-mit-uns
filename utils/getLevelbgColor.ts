export function getLevelStyle(code: string) {
  switch (code) {
    case 'A1':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100',
        text: 'text-blue-700',
      }
    case 'A2':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-100',
        text: 'text-yellow-700',
      }
    case 'B1':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        hover: 'hover:bg-red-100',
        text: 'text-red-700',
      }
    case 'B2':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100',
        text: 'text-purple-700',
      }
    case 'C1':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        hover: 'hover:bg-green-100',
        text: 'text-green-700',
      }
    case 'C2':
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-100',
        text: 'text-indigo-700',
      }
    default:
      return {
        bg: 'bg-white',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-100',
        text: 'text-gray-700',
      }
  }
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-800'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'Hard':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
