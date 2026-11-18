export interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  speaker: 1 | 2 | 'both';
  bodyText: string[];
  speakerNotes: string;
  accentColor: string;
}

export const slides: Slide[] = [
  {
    id: 1,
    title: 'NEO CITY 2050',
    subtitle: 'Designing the City of the Future',
    speaker: 'both',
    bodyText: ['How can engineers make cities smarter, greener, and more comfortable?', 'Join us on a tour of four districts built for people and the planet.'],
    speakerNotes: 'Speaker 1: Good morning / afternoon. We are going to take you on a journey to Neo City 2050 — a vision of what a smart, sustainable city could look like. Speaker 2: Our presentation will answer one key question: how can engineers make cities smarter, greener, and more comfortable for everyone?',
    accentColor: '#00f0ff',
  },
  {
    id: 2,
    title: 'Problems in Modern Cities',
    subtitle: 'Three challenges we must solve',
    speaker: 1,
    bodyText: ['🚗 Traffic Congestion — gridlock wastes time, fuel and money', '💨 Air Pollution — 7 million deaths per year linked to dirty air (WHO)', '⚡ High Energy Consumption — cities use 75% of global energy', '🏠 Unequal access to housing, green spaces and essential services'],
    speakerNotes: "Speaker 1: Today's cities face serious problems. First, traffic congestion: millions of people sit in jams every day, burning fuel and losing hours of their lives. Second, air pollution: the World Health Organization estimates that dirty air causes around seven million deaths per year worldwide. Third, cities consume 75% of the world's energy — most of it from fossil fuels. And finally, there is a deep inequality: not everyone has access to good housing, parks, schools or hospitals.",
    accentColor: '#ef4444',
  },
  {
    id: 3,
    title: 'Smart Engineering Solutions',
    subtitle: 'Three innovations that change everything',
    speaker: 2,
    bodyText: ['🤖 AI Traffic Signals — analyse live data and reduce waiting times', '☀️ Renewable Energy — solar, wind and battery storage replace fossil fuels', '🏢 Smart Buildings — sensors monitor energy and cut waste automatically', '🌳 Green Infrastructure — trees, gardens and sensors improve air and health'],
    speakerNotes: "Speaker 2: So how do we solve these problems? Neo City 2050 uses three main technologies. First, AI-powered traffic signals that read live sensor data and change their timing to keep traffic moving — this can cut congestion by up to 40 percent. Second, renewable energy: our Energy District targets 100% of its electricity from solar panels and wind turbines, stored in batteries. Third, smart buildings that automatically monitor and reduce their own energy use.",
    accentColor: '#22d3ee',
  },
  {
    id: 4,
    title: 'How the Connected City Works',
    subtitle: 'Sensors → AI → Action → Human Oversight',
    speaker: 1,
    bodyText: ['📡 Sensors collect traffic, energy, air-quality and water data 24/7', '🧠 AI analyses patterns and recommends optimisations in real time', '⚡ Smart grid balances electricity supply and demand automatically', '🚌 Transport systems coordinate buses, trains and shuttles together', '👷 Human operators make all important final decisions'],
    speakerNotes: "Speaker 1: Let me explain how the city's systems connect. Thousands of sensors throughout the city collect data every second — traffic flow, energy consumption, air quality, temperature. This data feeds into AI systems that identify patterns and suggest improvements. For example, if the AI detects a traffic jam forming, it adjusts signal timings before the jam gets worse. The smart grid does the same for electricity — it shifts loads and activates storage to avoid blackouts. Crucially, human operators always have the final word. Technology supports people; it does not replace them.",
    accentColor: '#a855f7',
  },
  {
    id: 5,
    title: 'Sustainability & Accessibility',
    subtitle: 'A city for everyone, within planetary limits',
    speaker: 2,
    bodyText: ['♻️ 100% renewable electricity target — zero carbon emissions ambition', '💧 Rainwater harvesting and water recycling throughout', '🌿 Biodiversity corridors and 35% urban canopy target', '♿ Step-free stations, tactile paving and audio signals everywhere', '🚌 Affordable public transport — essential services within 15 minutes', '📱 Accessible information in multiple formats and languages'],
    speakerNotes: "Speaker 2: Neo City 2050 is designed to be both sustainable and accessible. On sustainability: we target 100% renewable electricity, which means zero carbon emissions from power. Rainwater is harvested and recycled so we reduce water waste. Green corridors connect parks across the city, supporting wildlife and human wellbeing. On accessibility: every station is step-free, with lifts and ramps. Tactile paving guides people with visual impairments. Audio signals help at every crossing. All transport information is available in multiple languages and formats so nobody is excluded.",
    accentColor: '#22c55e',
  },
  {
    id: 6,
    title: 'The Four Districts',
    subtitle: 'Interactive city model — explore each zone',
    speaker: 'both',
    bodyText: ['🌿 GREEN CORE — vertical forests, cooling and biodiversity', '🚗 MOBILITY GRID — zero-emission, AI-coordinated transport', '⚡ ENERGY DISTRICT — solar, wind and battery storage', '🏠 HUMAN-CENTRED LIVING — 15-minute inclusive neighbourhood'],
    speakerNotes: "Speaker 1: You can see our four districts in the interactive 3D model. Each one solves a different problem. The Green Core tackles air pollution and urban heat. Speaker 2: The Mobility Grid eliminates traffic congestion and emissions. The Energy District replaces fossil fuels entirely. And the Human-Centred Living district ensures that all these benefits are shared equally by every resident.",
    accentColor: '#f59e0b',
  },
  {
    id: 7,
    title: 'Benefits, Limitations & Impact',
    subtitle: 'Technology is powerful — but not perfect',
    speaker: 1,
    bodyText: ['✅ Cleaner air, safer streets and lower energy bills', '✅ Greater equality and better public health', '⚠️ High initial investment — billions of euros required', '⚠️ Cybersecurity: connected systems are vulnerable to attacks', '⚠️ Digital exclusion — not everyone can use smartphones', '⚠️ Environmental cost of manufacturing technology (materials, energy)'],
    speakerNotes: "Speaker 1: We want to be honest: Neo City 2050 is not a perfect solution. The benefits are real — cleaner air, safer streets, lower bills and more equality. But there are serious challenges. Building this city would cost billions and take decades. Connected systems can be hacked — cybersecurity is a critical concern. Some people, especially elderly residents, may struggle to use digital services. And even green technology has an environmental footprint: solar panels require rare materials and batteries degrade over time. Human oversight and democratic governance are essential.",
    accentColor: '#f97316',
  },
  {
    id: 8,
    title: 'Thank You',
    subtitle: 'NEO CITY 2050 — Smarter. Greener. For Everyone.',
    speaker: 'both',
    bodyText: ['The city of the future is not a dream — it is an engineering challenge.', 'We have the tools. We need the will, the investment, and the equity.', '"Cities have the capability of providing something for everybody, only because, and only when, they are created by everybody." — Jane Jacobs'],
    speakerNotes: "Speaker 2: To conclude — the city of the future is not science fiction. Many of the technologies we described already exist. The question is whether we choose to invest in them and ensure they benefit everyone. Speaker 1: We hope our project has shown you that engineering can make cities smarter, greener, and more comfortable — but only if we design them with people, not just for efficiency. Thank you very much. We are happy to take your questions.",
    accentColor: '#00f0ff',
  },
];
