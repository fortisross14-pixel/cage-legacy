import type {
  ArchetypeConfig,
  Archetype,
  Country,
  DivisionConfig,
  Division,
  RarityConfig,
  Rarity,
} from '@/types';

// ============================================================
// NAME POOLS
// ============================================================

export const FIRST_NAMES: string[] = [
  'Alex', 'Marcus', 'Diego', 'Yuki', 'Liam', 'Mateo', 'Kai', 'Hiro', 'Dmitri', 'Tariq',
  'Bruno', 'Felipe', 'Andre', 'Carlos', 'Rafael', 'Lucas', 'Pedro', 'Joao', 'Sergio', 'Mikhail',
  'Vladimir', 'Anton', 'Igor', 'Pavel', 'Boris', 'Khabib', 'Islam', 'Murad', 'Akhmed', 'Rashid',
  'Tyler', 'Jake', 'Cody', 'Dustin', 'Justin', 'Conor', 'Sean', 'Michael', 'Daniel', 'Jose',
  'Jorge', 'Henry', 'Frankie', 'Tony', 'Nate', 'Nick', 'Max', 'Stipe', 'Cain', 'Junior',
  'Anderson', 'Lyoto', 'Mauricio', 'Shogun', 'Renan', 'Vitor', 'Demian', 'Charles', 'Eddie', 'Beneil',
  'Gilbert', 'Belal', 'Kamaru', 'Colby', 'Gunnar', 'Stephen', 'Darren', 'Leon', 'Geoff', 'Israel',
  'Robert', 'Kelvin', 'Yoel', 'Paulo', 'Costa', 'Marvin', 'Khamzat', 'Gegard', 'Jiri', 'Glover',
  'Aleksandar', 'Magomed', 'Curtis', 'Volkan', 'Anthony', 'Thiago', 'Jamahal', 'Jan', 'Francis',
  'Tom', 'Derrick', 'Ciryl', 'Sergei', 'Tai', 'Marcin', 'Alexander', 'Jon',
];

export const LAST_NAMES: string[] = [
  'Silva', 'Santos', 'Oliveira', 'Costa', 'Pereira', 'Souza', 'Lima', 'Rodrigues', 'Almeida', 'Carvalho',
  'Volkov', 'Petrov', 'Sokolov', 'Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Mikhailov', 'Fedorov',
  'Nurmagomedov', 'Makhachev', 'Ankalaev', 'Magomedov', 'Aliev', 'Dzhanaev', 'Tagirov', 'Khaibulaev', 'Yandiev', 'Bagomedov',
  'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
  'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis',
  'Tanaka', 'Yamamoto', 'Sato', 'Suzuki', 'Watanabe', 'Takahashi', 'Kobayashi', 'Nakamura', 'Saito', 'Inoue',
  'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Han', 'Yoon', 'Lim', 'Cho',
  'McKenzie', "O'Connor", 'Murphy', 'Kelly', 'Walsh', 'Byrne', 'Ryan', 'Sullivan', 'Gallagher', 'Doyle',
  'Novak', 'Kovac', 'Horvat', 'Marinkovic', 'Petrovic', 'Djordjevic', 'Stojanovic', 'Pavlovic', 'Jovanovic', 'Lukic',
  'Adesanya', 'Okafor', 'Adebayo', 'Nwosu', 'Onyeka', 'Eze', 'Obi', 'Mensah', 'Diallo', 'Traore',
];

export const NICKNAMES: string[] = [
  'The Predator', 'The Notorious', 'The Eagle', 'The Spider', 'Bones', 'The Last Stylebender',
  'The Reaper', 'The Diamond', 'Showtime', 'Ruthless', 'The Korean Zombie', 'Cowboy',
  'The Pitbull', 'Suga', 'Funkmaster', 'Borrachinha', 'DC', 'The Black Beast', 'The Eraser',
  'Chito', 'Do Bronx', 'The Highlight', 'Lights Out', 'The Sandman', 'The Crusher',
  'Iron', 'Stone', 'Steel', 'Thunder', 'Lightning', 'Hurricane', 'Wolverine', 'Hawk',
  'The Surgeon', 'The Mechanic', 'Ghost', 'The Phantom', 'The Magician', 'The Wizard',
  'Bonecrusher', 'Skullsplitter', 'Headhunter', 'The Assassin', 'The Hitman', 'The Executioner',
  'Smooth', 'Slick', 'Silk', 'Velvet', 'Speed', 'Blitz', 'Flash', 'Sniper',
  'The Bear', 'The Lion', 'The Wolf', 'The Tiger', 'The Cobra', 'The Mamba', 'The Viper', 'The Shark',
  'Pretty Boy', 'Bad Boy', 'Big Country', 'Cyborg', 'Spartan', 'Gladiator', 'Warrior',
  'The Conductor', 'The Maestro', 'The Professor', 'The Sensei', 'Dr. Pain',
  'The Anomaly', 'The Outlaw', 'The Renegade', 'El Cucuy', 'La Pantera', 'O Furacão',
  'Stitch', 'Razor', 'Blade', 'Anvil', 'Hammer', 'Mauler', 'Mangler', 'Reckless',
];

export const COUNTRIES: Country[] = [
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Dagestan', flag: '🏔️' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
];

export const EVENT_PREFIXES: string[] = [
  'Fight Night', 'Cage Wars', 'Championship', 'Combat Night', 'Grand Prix',
  'Showdown', 'Battleground', 'Apex', 'Mayhem', 'Domination',
  'Fury', 'Reckoning', 'Onslaught', 'Uprising', 'Legacy',
];

export const CITIES: string[] = [
  'Las Vegas', 'New York', 'Rio de Janeiro', 'Tokyo', 'London', 'Sydney', 'Toronto',
  'Moscow', 'Abu Dhabi', 'Singapore', 'Paris', 'Berlin', 'São Paulo', 'Mexico City',
  'Dublin', 'Glasgow', 'Auckland', 'Stockholm', 'Amsterdam', 'Manchester',
];

// ============================================================
// RARITY
// ============================================================

export const RARITIES: Record<Rarity, RarityConfig> = {
  common:    { weight: 50, label: 'Common',    ceilMin: 55, ceilMax: 70 },
  uncommon:  { weight: 28, label: 'Uncommon',  ceilMin: 65, ceilMax: 78 },
  rare:      { weight: 15, label: 'Rare',      ceilMin: 75, ceilMax: 86 },
  epic:      { weight: 5,  label: 'Epic',      ceilMin: 84, ceilMax: 92 },
  legendary: { weight: 2,  label: 'Legendary', ceilMin: 90, ceilMax: 99 },
};

// ============================================================
// ARCHETYPES
// ============================================================

export const ARCHETYPES: Record<Archetype, ArchetypeConfig> = {
  striker: {
    label: 'Striker',
    weights: { striking: 1.4, grappling: 0.7, submission: 0.7, cardio: 1.0, durability: 1.0, fightIQ: 1.0 },
    finishBias: { ko: 1.6, sub: 0.4, dec: 0.9 },
  },
  wrestler: {
    label: 'Wrestler',
    weights: { striking: 0.8, grappling: 1.5, submission: 1.0, cardio: 1.1, durability: 1.1, fightIQ: 1.0 },
    finishBias: { ko: 0.8, sub: 0.9, dec: 1.3 },
  },
  submission: {
    label: 'Submission Specialist',
    weights: { striking: 0.8, grappling: 1.2, submission: 1.6, cardio: 1.0, durability: 0.9, fightIQ: 1.0 },
    finishBias: { ko: 0.5, sub: 1.9, dec: 0.9 },
  },
  pressure: {
    label: 'Pressure Fighter',
    weights: { striking: 1.1, grappling: 1.0, submission: 0.9, cardio: 1.5, durability: 1.2, fightIQ: 0.9 },
    finishBias: { ko: 1.2, sub: 0.7, dec: 1.1 },
  },
  tactical: {
    label: 'Tactical Fighter',
    weights: { striking: 1.0, grappling: 1.0, submission: 1.0, cardio: 1.1, durability: 1.0, fightIQ: 1.6 },
    finishBias: { ko: 0.7, sub: 0.6, dec: 1.6 },
  },
};

export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES) as Archetype[];

// ============================================================
// DIVISIONS
// ============================================================
// Per design doc: "Heavyweights age slower"
// Also: heavier divisions tend to finish more often (real-world pattern)

export const DIVISIONS: Record<Division, DivisionConfig> = {
  lightweight: {
    label: 'Lightweight',
    shortLabel: 'LW',
    prospectMax: 24,
    primeMin: 25,
    primeMax: 32,
    retireRiskStart: 34,
    retireRiskMax: 42,
    finishRateMultiplier: 0.95,
  },
  welterweight: {
    label: 'Welterweight',
    shortLabel: 'WW',
    prospectMax: 24,
    primeMin: 25,
    primeMax: 33,
    retireRiskStart: 35,
    retireRiskMax: 43,
    finishRateMultiplier: 1.0,
  },
  lightHeavyweight: {
    label: 'Light Heavyweight',
    shortLabel: 'LHW',
    prospectMax: 25,
    primeMin: 26,
    primeMax: 34,
    retireRiskStart: 36,
    retireRiskMax: 44,
    finishRateMultiplier: 1.1,
  },
  heavyweight: {
    label: 'Heavyweight',
    shortLabel: 'HW',
    prospectMax: 26,
    primeMin: 27,
    primeMax: 36,
    retireRiskStart: 38,
    retireRiskMax: 46,
    finishRateMultiplier: 1.3,
  },
};

export const DIVISION_KEYS = Object.keys(DIVISIONS) as Division[];

// ============================================================
// MATCHUP MATRIX
// ============================================================
// Row archetype's effective strength against column archetype

export const MATCHUP_MATRIX: Record<Archetype, Record<Archetype, number>> = {
  striker:    { striker: 1.0,  wrestler: 0.85, submission: 1.1, pressure: 0.95, tactical: 1.0 },
  wrestler:   { striker: 1.15, wrestler: 1.0,  submission: 1.0, pressure: 0.95, tactical: 1.0 },
  submission: { striker: 0.95, wrestler: 1.0,  submission: 1.0, pressure: 0.9,  tactical: 1.0 },
  pressure:   { striker: 1.05, wrestler: 1.05, submission: 1.1, pressure: 1.0,  tactical: 1.1 },
  tactical:   { striker: 1.0,  wrestler: 1.0,  submission: 1.0, pressure: 0.9,  tactical: 1.0 },
};
