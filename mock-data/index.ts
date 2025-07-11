export const features = [
  {
    icon: 'ph:book-open',
    title: 'Bilingual Lessons',
    description:
      'Structured lessons with English ↔ word content, audio pronunciation, and visual aids.',
    color: 'text-blue-600 bg-blue-50/50',
  },
  {
    icon: 'mdi:brain',
    title: 'Spaced Repetition',
    description:
      'Smart flashcard system that adapts to your learning pace for optimal retention.',
    color: 'text-purple-600 bg-purple-50/50',
  },
  {
    icon: 'lucide:message-square',
    title: 'Interactive Dialogues',
    description:
      'Practice real conversations with branching dialogue trees and feedback.',
    color: 'text-green-600 bg-green-50/50',
  },
  {
    icon: 'mdi:dictionary',
    title: 'Built-in Dictionary',
    description:
      'Comprehensive EN ↔ DE dictionary with IPA, examples, and personal bookmarks.',
    color: 'text-orange-600 bg-orange-50/50',
  },
  {
    icon: 'mdi:progress-check',
    title: 'Level-Based Learning',
    description:
      'Structured progression from A1 to B2 with clear milestones and assessments.',
    color: 'text-red-600 bg-red-50/50',
  },
  {
    icon: 'mdi:trophy',
    title: 'Gamification',
    description:
      'Earn points, unlock achievements, and compete with friends on leaderboards.',
    color: 'text-yellow-600 bg-yellow-50/50',
  },
  {
    icon: 'mdi:note',
    title: 'Personal Notes',
    description:
      'Highlight difficult words, add personal notes, and create custom study sets.',
    color: 'text-indigo-600 bg-indigo-50/50',
  },
  {
    icon: 'mdi:lightbulb',
    title: 'Smart Roadmap',
    description:
      'AI-powered daily suggestions and personalized learning path recommendations.',
    color: 'text-pink-600 bg-pink-50/50',
  },
  {
    icon: 'mdi:globe',
    title: 'Topic-Based Learning',
    description:
      'Learn word for specific contexts: travel, business, interviews, and more.',
    color: 'text-teal-600 bg-teal-50/50',
  },
]
export const levels = [
  {
    code: 'A1',
    title: 'Beginner',
    description: 'Basic phrases and everyday expressions',
    textColor: 'text-green-700',
    features: [
      'Greetings & introductions',
      'Numbers & time',
      'Basic vocabulary',
    ],
  },
  {
    code: 'A2',
    title: 'Elementary',
    description: 'Simple conversations and familiar topics',
    textColor: 'text-blue-700',
    features: ['Past tense basics', 'Shopping & dining', 'Family & hobbies'],
  },
  {
    code: 'B1',
    title: 'Intermediate',
    description: 'Clear standard language on familiar matters',
    textColor: 'text-purple-700',
    features: ['Work & studies', 'Travel situations', 'Express opinions'],
  },
  {
    code: 'B2',
    title: 'Upper Intermediate',
    description: 'Complex texts and abstract topics',
    textColor: 'text-orange-700',
    features: ['Professional word', 'Complex grammar', 'Fluent discussions'],
  },
]

export const demoFlashcards = [
  {
    meaning: 'Hello',
    word: 'Hallo',
    pronunciation: '/ˈhalo/',
    difficulty: 'Easy',
    topic: 'Greetings',
  },
  {
    meaning: 'I am tired',
    word: 'Ich bin müde',
    pronunciation: '/ɪç bɪn ˈmyːdə/',
    difficulty: 'Medium',
    topic: 'Feelings',
  },
  {
    meaning: 'Goodbye',
    word: 'Guten Tag',
    pronunciation: '/ˈgutən tæg/',
    difficulty: 'Hard',
    topic: 'Greetings',
  },
  {
    meaning: 'Yes',
    word: 'Ja',
    pronunciation: '/jə/',
    difficulty: 'Easy',
    topic: 'Affirmatives',
  },
  {
    meaning: 'No',
    word: 'Nein',
    pronunciation: '/nəɪn/',
    difficulty: 'Medium',
    topic: 'Negatives',
  },
]

export const sampleLesson = {
  title: 'At the Restaurant',
  level: 'A2',
  vocabulary: [
    {
      id: '1',
      word: 'Die Speisekarte',
      meaning: 'Menu',
      example: 'Könnte ich bitte die Speisekarte haben?',
      level: 'A2',
      audioUrl: '',
      imageUrl: undefined,
      transcription: '/ˈʃpaɪzəˌkartə/',
      type: 'noun',
    },
    {
      id: '2',
      word: 'Der Kellner',
      meaning: 'Waiter',
      example: 'Der Kellner bringt die Rechnung.',
      level: 'A2',
      audioUrl: '',
      imageUrl: undefined,
      transcription: '/ˈkɛlnɐ/',
      type: 'noun',
    },
    {
      id: '3',
      word: 'Die Rechnung',
      meaning: 'Bill',
      example: 'Ich möchte die Rechnung bezahlen.',
      level: 'A2',
      audioUrl: '',
      imageUrl: undefined,
      transcription: '/ˈrɛçnʊŋ/',
      type: 'noun',
    },
  ],
  sentences: [
    {
      id: '1',
      meaning: 'Could I have the menu, please?',
      word: 'Könnte ich bitte die Speisekarte haben?',
      level: 'A2',
      audioUrl: '',
      type: 'sentence',
    },
    {
      id: '2',
      meaning: 'I would like to order.',
      word: 'Ich möchte gerne bestellen.',
      level: 'A2',
      audioUrl: '',
      type: 'sentence',
    },
  ],
}

export const topicsData = {
  A1: [
    {
      id: 'a1-travel',
      title: 'Travel & Transportation',
      description: 'Essential vocabulary for traveling in Germany',
      paragraph: `Ich fahre gerne mit dem Zug durch Deutschland. Der Bahnhof ist sehr groß und modern. Mein Ticket kostet zwanzig Euro. Die Reise dauert drei Stunden. Ich nehme auch manchmal das Flugzeug, aber das ist teurer. Am Flughafen muss ich meinen Pass zeigen. Die Flugreise ist schneller, aber ich mag die Landschaft vom Zug aus sehen.`,
      difficulty: 'Beginner',
      estimatedTime: '15 min',
      wordsCount: 28,
      completedWords: 12,
      masteredWords: 8,
    },
    {
      id: 'a1-restaurant',
      title: 'At the Restaurant',
      description: 'Learn how to order food and interact with waiters',
      paragraph: `Guten Abend! Ich hätte gerne einen Tisch für zwei Personen. Haben Sie die Speisekarte auf Englisch? Ich möchte das Schnitzel mit Kartoffeln bestellen. Meine Freundin nimmt den Salat. Können wir auch eine Flasche Wasser haben? Das Essen schmeckt sehr gut. Die Rechnung, bitte! Ist Trinkgeld üblich in Deutschland?`,
      difficulty: 'Beginner',
      estimatedTime: '18 min',
      wordsCount: 32,
      completedWords: 5,
      masteredWords: 3,
    },
  ],
  A2: [
    {
      id: 'a2-work',
      title: 'Work & Office Life',
      description: 'Professional German vocabulary and office situations',
      paragraph: `Mein Arbeitsplatz befindet sich im Stadtzentrum. Ich arbeite in einem modernen Bürogebäude. Meine Kollegen sind sehr freundlich und hilfsbereit. Wir haben täglich um neun Uhr eine Besprechung. Mein Chef ist streng, aber fair. Die Mittagspause dauert eine Stunde. Nach Feierabend gehe ich oft mit den Kollegen etwas trinken.`,
      difficulty: 'Elementary',
      estimatedTime: '20 min',
      wordsCount: 35,
      completedWords: 8,
      masteredWords: 2,
    },
  ],
  B1: [
    {
      id: 'b1-culture',
      title: 'German Culture & Traditions',
      description: 'Explore German customs, festivals, and cultural practices',
      paragraph: `Die deutsche Kultur ist sehr vielfältig und reich an Traditionen. Das Oktoberfest in München ist weltberühmt und zieht Millionen von Besuchern an. Deutsche feiern auch gerne Weihnachtsmärkte im Winter, wo man Glühwein trinkt und handgemachte Geschenke kauft. Die Deutschen sind bekannt für ihre Pünktlichkeit und Ordnung. Sonntags bleiben die meisten Geschäfte geschlossen, weil es ein Ruhetag ist.`,
      difficulty: 'Intermediate',
      estimatedTime: '25 min',
      wordsCount: 42,
      completedWords: 3,
      masteredWords: 1,
    },
  ],
  B2: [
    {
      id: 'b2-finance',
      title: 'Financial Transactions',
      description:
        'Learn about common financial transactions and their translations',
      paragraph: `In Deutschland gibt es viele Möglichkeiten, Finanztransaktionen durchzuführen. Sie können Geld am Geldautomaten abheben oder in einer Bankfiliale ein Konto eröffnen. Es ist wichtig, die verschiedenen Arten von Konten und ihre Gebühren zu verstehen. Kreditkarten sind weit verbreitet, und viele Geschäfte akzeptieren sie. Auch Online-Banking wird immer beliebter.`,
      difficulty: 'Upper Intermediate',
      estimatedTime: '30 min',
      wordsCount: 50,
      completedWords: 0,
      masteredWords: 0,
    },
  ],
  C1: [
    {
      id: 'c1-business',
      title: 'Business Communication',
      description:
        'Advanced vocabulary and expressions for professional settings',
      paragraph: `Die Geschäftswelt erfordert präzise Kommunikation. Meetings müssen gut vorbereitet werden, und die Teilnehmer sollten ihre Standpunkte klar und überzeugend darlegen. Das Verständnis von Fachbegriffen ist entscheidend, um effektiv an Diskussionen teilzunehmen. Networking und der Aufbau von Beziehungen sind ebenfalls wichtige Aspekte im Berufsleben.`,
      difficulty: 'Advanced',
      estimatedTime: '35 min',
      wordsCount: 60,
      completedWords: 0,
      masteredWords: 0,
    },
  ],
  C2: [
    {
      id: 'c2-culture',
      title: 'Cultural Nuances',
      description:
        'Understanding subtle differences in cultural references and idioms',
      paragraph: `Die deutsche Sprache enthält viele Redewendungen, die oft nicht wörtlich übersetzt werden können. Ein tiefes Verständnis der Kultur ist notwendig, um diese Nuancen zu erfassen. Beispielsweise sagt man "Tomaten auf den Augen haben", was bedeutet, dass jemand etwas Offensichtliches nicht sieht. Solche Ausdrücke sind Teil der Alltagskommunikation und zeigen die Vielfalt der Sprache.`,
      difficulty: 'Proficient',
      estimatedTime: '40 min',
      wordsCount: 70,
      completedWords: 0,
      masteredWords: 0,
    },
  ],
}

export const flashcardsData: VocabularyWord[] = [
  {
    id: 'fahre',
    word: 'fahre',
    meaning: 'drive/travel',
    transcription: '/ˈfaːrə/',
    difficulty: 'easy',
    topics: ['transportation'],
    synonyms: [],
    antonyms: [],
  },
  {
    id: 'bahnhof',
    word: 'der Bahnhof',
    meaning: 'train station',
    transcription: '/ˈbaːnhoːf/',
    difficulty: 'medium',
    topics: ['transportation'],
    synonyms: [],
    antonyms: [],
  },
  {
    id: 'ticket',
    word: 'das Ticket',
    meaning: 'ticket',
    transcription: '/ˈtɪkət/',
    difficulty: 'easy',
    topics: ['transportation'],
    synonyms: [],
    antonyms: [],
  },
  {
    id: 'reise',
    word: 'die Reise',
    meaning: 'journey/trip',
    transcription: '/ˈraɪzə/',
    difficulty: 'medium',
    topics: ['transportation'],
    synonyms: [],
    antonyms: [],
  },
  {
    id: 'flugzeug',
    word: 'das Flugzeug',
    meaning: 'airplane',
    transcription: '/ˈfluːktsɔɪk/',
    difficulty: 'medium',
    topics: ['transportation'],
    synonyms: [],
    antonyms: [],
  },
]
