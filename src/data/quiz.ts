export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  category: string;
  categoryColor: string;
  question: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    category: 'Green Core',
    categoryColor: '#22c55e',
    question: 'What is the main urban benefit of installing vertical forests on tower facades?',
    options: [
      { id: 'a', text: 'They increase parking space for electric cars' },
      { id: 'b', text: 'They reduce local air temperature and filter air pollution' },
      { id: 'c', text: 'They generate electricity through photosynthesis' },
      { id: 'd', text: 'They replace all underground water pipes' },
    ],
    correctId: 'b',
    explanation:
      'Vertical forests cool surrounding streets by up to 3 °C (design target) through evapotranspiration and shade, while also absorbing particulate air pollution.',
  },
  {
    id: 2,
    category: 'Mobility Grid',
    categoryColor: '#3b82f6',
    question: 'How do AI-coordinated traffic signals reduce congestion in Neo City 2050?',
    options: [
      { id: 'a', text: 'They stay permanently green for all vehicles' },
      { id: 'b', text: 'They analyse live sensor data and adjust timing in real time' },
      { id: 'c', text: 'They block all private cars from entering the city' },
      { id: 'd', text: 'They use a fixed weekly timetable' },
    ],
    correctId: 'b',
    explanation:
      'IoT sensors feed live traffic, weather and occupancy data into an AI system, which adjusts green-light durations before jams form — reducing congestion by up to 40 % (design target).',
  },
  {
    id: 3,
    category: 'Energy District',
    categoryColor: '#f59e0b',
    question: 'What does the acronym BIPV stand for in the context of the Energy District?',
    options: [
      { id: 'a', text: 'Battery-Installed Power Voltage' },
      { id: 'b', text: 'Building-Improved Panel Ventilation' },
      { id: 'c', text: 'Building-Integrated Photovoltaics' },
      { id: 'd', text: 'Bio-Industrial Power Variation' },
    ],
    correctId: 'c',
    explanation:
      'BIPV (Building-Integrated Photovoltaics) refers to solar cells built directly into walls, windows or roof panels — turning the building envelope itself into a power generator.',
  },
  {
    id: 4,
    category: 'Human-Centred Living',
    categoryColor: '#a855f7',
    question: 'Which accessibility feature is specifically designed to assist people with visual impairments?',
    options: [
      { id: 'a', text: 'Wide cycling lanes' },
      { id: 'b', text: 'Solar roof panels on every building' },
      { id: 'c', text: 'Tactile paving along all footpaths' },
      { id: 'd', text: 'Battery storage in every home' },
    ],
    correctId: 'c',
    explanation:
      'Tactile paving uses raised patterns underfoot that people with visual impairments can detect with a cane or their feet, guiding them safely along pedestrian routes.',
  },
  {
    id: 5,
    category: 'Energy District',
    categoryColor: '#f59e0b',
    question: 'What is a smart microgrid?',
    options: [
      { id: 'a', text: 'A miniature electric vehicle used for deliveries' },
      { id: 'b', text: 'A small internet network connecting only smart homes' },
      { id: 'c', text: 'A local electricity network that uses digital technology to balance supply and demand automatically' },
      { id: 'd', text: 'A type of AI camera that monitors traffic' },
    ],
    correctId: 'c',
    explanation:
      'A smart microgrid is a local electricity network that can operate independently or alongside the main grid, using sensors and AI to balance generation (solar, wind) with consumption in real time.',
  },
  {
    id: 6,
    category: 'Sustainability',
    categoryColor: '#22d3ee',
    question: 'The Neo City 2050 Energy District targets 100 % renewable electricity. Which combination of sources makes this possible?',
    options: [
      { id: 'a', text: 'Coal and nuclear power' },
      { id: 'b', text: 'Solar panels, wind turbines and battery storage' },
      { id: 'c', text: 'Hydrogen fuel cells and petrol generators' },
      { id: 'd', text: 'Tidal waves and geothermal only' },
    ],
    correctId: 'b',
    explanation:
      'Solar panels generate power during the day, wind turbines at night and in winter, and battery storage bridges any gap between generation and demand — together targeting 100 % clean electricity.',
  },
  {
    id: 7,
    category: 'How It Works',
    categoryColor: '#a855f7',
    question: 'In Neo City 2050, who is ultimately responsible for important decisions — even when AI provides recommendations?',
    options: [
      { id: 'a', text: 'The AI system itself, as it is always more accurate than humans' },
      { id: 'b', text: 'An international tech company' },
      { id: 'c', text: 'Human city operators, who retain full authority to override AI' },
      { id: 'd', text: 'Decisions are made automatically without human review' },
    ],
    correctId: 'c',
    explanation:
      'Technology supports human decision-making — it never replaces it. Human operators monitor all systems through a central dashboard and can override any AI recommendation at any time.',
  },
  {
    id: 8,
    category: 'Benefits & Limits',
    categoryColor: '#ef4444',
    question: 'Which of the following is a genuine LIMITATION of smart city technology?',
    options: [
      { id: 'a', text: 'It reduces traffic congestion' },
      { id: 'b', text: 'It lowers household energy bills' },
      { id: 'c', text: 'Connected systems can be vulnerable to cybersecurity attacks' },
      { id: 'd', text: 'It improves air quality' },
    ],
    correctId: 'c',
    explanation:
      'The more interconnected city systems become, the larger the potential attack surface for hackers. Robust cybersecurity infrastructure, regular audits and human oversight are essential to manage this risk.',
  },
];

export const scoreMessages = [
  { min: 0, max: 3, emoji: '🌱', title: 'City Explorer', text: 'Good start! Revisit the four districts and the Engineering section to deepen your knowledge.' },
  { min: 4, max: 5, emoji: '🏙️', title: 'Smart Citizen', text: 'Solid understanding! You grasp the key ideas behind sustainable urban design.' },
  { min: 6, max: 7, emoji: '⚡', title: 'Urban Innovator', text: 'Impressive! You understand how smart technology, sustainability and accessibility work together.' },
  { min: 8, max: 8, emoji: '🏆', title: 'City Engineer', text: 'Perfect score! You are ready to design the city of the future. Neo City 2050 needs you!' },
];
