export interface District {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  description: string;
  features: string[];
  engineering: string;
  benefits: string[];
  limitations: string[];
  stats: { label: string; value: string }[];
}

export const districts: District[] = [
  {
    id: 'green-core',
    name: 'GREEN CORE',
    color: '#22c55e',
    position: [-13, 0, -13],
    description: 'A living urban forest embedded in the city fabric — vertical gardens, rain gardens, and biodiversity corridors cool the streets and clean the air.',
    features: ['Vertical forests on tower facades', 'Green rooftop gardens', 'Rain garden drainage system', 'Biodiversity corridors', 'Urban cooling zones', 'Environmental sensor network'],
    engineering: 'Lightweight hydroponic planting systems on structural frames allow vegetation at height. Permeable pavements and rain gardens manage stormwater naturally. Sensor arrays monitor air quality, temperature and humidity in real time.',
    benefits: ['Reduces urban heat island effect by up to 3°C (design target)', 'Cleans particulate air pollution', 'Improves biodiversity', 'Improves mental well-being of residents'],
    limitations: ['High maintenance cost for vertical gardens', 'Requires specialist expertise', 'Structural load requirements increase construction cost'],
    stats: [{ label: 'Urban Canopy Target', value: '35%' }, { label: 'Cooling Ambition', value: '−3°C' }, { label: 'Species Supported', value: '120+' }],
  },
  {
    id: 'mobility-grid',
    name: 'MOBILITY GRID',
    color: '#3b82f6',
    position: [13, 0, -13],
    description: 'Zero-emission mobility powered by AI: autonomous electric shuttles, smart traffic signals, and a dense network of cycling and walking paths.',
    features: ['Electric autonomous shuttles', 'AI-coordinated traffic signals', 'Cycling superhighways', 'Walkable superblocks', 'Real-time transit app', 'Vehicle-free zones'],
    engineering: 'AI analyses live traffic, public transport occupancy and weather data to adjust signal timings, reroute buses and predict demand. Shared electric shuttles self-dispatch based on passenger requests via a smartphone app.',
    benefits: ['Reduces road congestion by up to 40% (design target)', 'Eliminates tailpipe emissions in the zone', 'Faster average journey times', 'Safer streets for pedestrians and cyclists'],
    limitations: ['High upfront infrastructure cost', 'Cybersecurity vulnerabilities', 'Requires public behaviour change', 'Digital exclusion risk for non-smartphone users'],
    stats: [{ label: 'Zero-Emission Trips Target', value: '70%' }, { label: 'Avg Wait Time', value: '<4 min' }, { label: 'Cycling Lanes', value: '45 km' }],
  },
  {
    id: 'energy-district',
    name: 'ENERGY DISTRICT',
    color: '#f59e0b',
    position: [-13, 0, 13],
    description: 'A self-sufficient energy zone: solar rooftops, wind turbines, battery storage and smart microgrids work together to supply clean electricity 24/7.',
    features: ['Solar rooftop panels', 'Solar building facades (BIPV)', 'Vertical axis wind turbines', 'Grid-scale battery storage', 'Smart microgrid controller', 'Peer-to-peer energy trading'],
    engineering: 'Building-integrated photovoltaics (BIPV) turn facades into power generators. A smart microgrid controller balances real-time generation and consumption, storing surplus in lithium-ion batteries and trading excess power with neighbours.',
    benefits: ['100% renewable electricity ambition (design target)', 'Reduces carbon emissions significantly', 'Lowers household energy bills', 'Resilient to grid outages'],
    limitations: ['Solar panels require rare materials (silicon, silver)', 'Battery storage degrades over time', 'High initial capital investment', 'Wind turbines require maintenance'],
    stats: [{ label: 'Renewable Target', value: '100%' }, { label: 'Battery Storage', value: '50 MWh' }, { label: 'Peak Solar Output', value: '8 MW' }],
  },
  {
    id: 'human-living',
    name: 'HUMAN-CENTRED LIVING',
    color: '#a855f7',
    position: [13, 0, 13],
    description: 'Smart, inclusive, mixed-use neighbourhoods where homes, schools, hospitals, parks and shops are all within a 15-minute walk.',
    features: ['Smart affordable homes', '15-minute neighbourhood design', 'Accessible public spaces', 'Community hospital & health centre', 'Public school with maker spaces', 'Step-free transport infrastructure', 'Tactile paving & audio signals', 'Multilingual digital signage'],
    engineering: 'Smart home systems monitor energy and water use, alerting residents to waste. Buildings use passive design (orientation, insulation, natural ventilation) to minimise energy demand. Universal design standards ensure step-free access throughout.',
    benefits: ['Reduces inequality in access to services', 'Lower energy bills for residents', 'Improved public health outcomes', 'Greater social cohesion'],
    limitations: ['Risk of gentrification and displacement', 'Smart home data raises privacy concerns', 'High design and construction complexity', 'Requires long-term governance commitment'],
    stats: [{ label: 'Walk Score', value: '98/100' }, { label: 'Affordable Units', value: '40%' }, { label: 'Services in 15 min', value: '100%' }],
  },
];
