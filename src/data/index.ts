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

/**
 * Countries with ISO 3166 alpha-2 codes for SVG flag rendering.
 * (Switched from emoji because flag emoji fails to render on Chrome/Windows.)
 */
export const COUNTRIES: Country[] = [
  { name: 'USA', code: 'US' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Russia', code: 'RU' },
  { name: 'Dagestan', code: 'DAG' },       // synthetic; use mountain glyph
  { name: 'Ireland', code: 'IE' },
  { name: 'England', code: 'GB-ENG' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Japan', code: 'JP' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Australia', code: 'AU' },
  { name: 'Canada', code: 'CA' },
  { name: 'Poland', code: 'PL' },
  { name: 'Sweden', code: 'SE' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Cameroon', code: 'CM' },
  { name: 'Kazakhstan', code: 'KZ' },
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

export const MATCHUP_MATRIX: Record<Archetype, Record<Archetype, number>> = {
  striker:    { striker: 1.0,  wrestler: 0.85, submission: 1.1, pressure: 0.95, tactical: 1.0 },
  wrestler:   { striker: 1.15, wrestler: 1.0,  submission: 1.0, pressure: 0.95, tactical: 1.0 },
  submission: { striker: 0.95, wrestler: 1.0,  submission: 1.0, pressure: 0.9,  tactical: 1.0 },
  pressure:   { striker: 1.05, wrestler: 1.05, submission: 1.1, pressure: 1.0,  tactical: 1.1 },
  tactical:   { striker: 1.0,  wrestler: 1.0,  submission: 1.0, pressure: 0.9,  tactical: 1.0 },
};

// ============================================================
// BALANCE — TUNEABLE CONSTANTS
// ============================================================
// All of these are pure numbers with no UI knowledge. Tune freely.

/**
 * Fight rating weights. Final score is 1.0 (boring) → 9.99 (instant classic).
 */
export const RATING = {
  // Base from combined fame: 0 fame → 1.5, 150 fame → ~4.7, asymptote at ~5.8
  FAME_BASE_FLOOR: 1.5,
  FAME_BASE_PEAK:  5.8,
  FAME_BASE_HALF:  150,

  // Additive boosts
  TITLE_BONUS:        1.4,
  MAIN_EVENT_BONUS:   0.4,

  // Competitiveness: closer in overall = more exciting
  COMPETITIVENESS_MAX: 1.7,
  COMPETITIVENESS_GAP_AT_ZERO: 0,    // 0 overall diff = full bonus
  COMPETITIVENESS_GAP_AT_FULL: 25,   // 25+ overall diff = no bonus

  // Drama by method/round (set per FightMethod + condition)
  DRAMA_KO_EARLY: 0.9,    // R1 KO
  DRAMA_KO_MID:   0.6,    // R2-3 KO
  DRAMA_KO_LATE:  0.8,    // R4-5 KO
  DRAMA_SUB_EARLY: 0.9,
  DRAMA_SUB_MID:   0.7,
  DRAMA_SUB_LATE:  0.8,
  DRAMA_DOC:       0.2,
  DRAMA_DEC_5R:    0.5,   // championship-rounds decision
  DRAMA_DEC_3R:    0.1,
  DRAMA_CLOSE_DEC_BONUS: 0.4, // applied if rounds were split

  // Upset: lower-ranked beats higher (delta in overall)
  UPSET_MAX_BONUS: 0.9,
  UPSET_GAP_AT_FULL: 20,  // 20+ overall edge upset = full bonus

  // Rivalry (prior meetings between these two)
  RIVALRY_BONUS_1:  0.3,
  RIVALRY_BONUS_2:  0.5,
  RIVALRY_BONUS_3:  0.7,
  RIVALRY_BONUS_4P: 0.9,

  // Random jitter
  JITTER: 0.4,

  // Bounds
  MIN: 1.0,
  MAX: 9.99,
} as const;

/**
 * Fame deltas applied on each fight (and aging).
 */
export const FAME = {
  WIN_BASE:                 1,
  WIN_FINISH_BONUS:         2,   // additional for KO/SUB
  WIN_MAIN_EVENT_BONUS:     3,
  WIN_TITLE_NEW:            8,   // claimed title
  WIN_TITLE_DEFENSE:        5,
  WIN_RATING_70_BONUS:      5,   // win in a fight rated 7.0+
  WIN_RATING_85_BONUS:      10,  // additional if 8.5+ (stacks: 7.0+ adds 5, 8.5+ adds another 5)
  STREAK_DIVISOR:           3,   // +floor(streak/3) on win

  LOSS_BASE:                -2,
  LOSS_TO_LOWER_FAME:       -3,  // additional if you lose to lower-fame opp
  LOSS_TO_LOWER_FAME_GAP:   40,  // how much lower they need to be

  // Annual decay if active and out of prime
  AGE_PAST_PRIME_DECAY:     -2,

  // Floor / cap
  MIN: 0,
} as const;

/**
 * Career points: drives P4P (active) and GOAT (all-time) leaderboards.
 * Gain rating-of-win on victory; small fixed loss on losses to keep balance.
 */
export const CAREER_POINTS = {
  WIN_MULT:    1.0,   // wins contribute full fight rating
  LOSS_FIXED:  -0.5,  // small penalty for any loss (encourages quality)
  LOSS_HIGH_FAME_OPP_DAMPEN: true, // losses to high-fame opp hurt less (handled in fame.ts)
} as const;

/**
 * Hard cap on stored best-fights list.
 */
export const BEST_FIGHTS_CAP = 50;

/**
 * Matchmaking — rivalry-aware booking.
 *
 * The matchmaker will preferentially book rematches/trilogies when conditions
 * are met. These knobs control how aggressively that happens.
 */
export const MATCHMAKING = {
  /** Probability we look for a rematch booking instead of going strictly by ranking. */
  REMATCH_BASE_CHANCE: 0.18,
  /** Rematch only triggers if the prior fight was within this rating-delta of being a classic. */
  REMATCH_MIN_RATING: 6.5,
  /** Rematch chance multiplier when prior fight was a close decision (split-style). */
  REMATCH_CLOSE_MULT: 1.6,
  /** Trilogy bonus chance — both fighters tied at 1-1 in series. */
  TRILOGY_CHANCE: 0.32,
  /** Don't book a rematch if the prior fight was more recent than N events. */
  REMATCH_COOLDOWN_EVENTS: 4,
  /** Don't book a rematch if the prior fight was older than N events (memory fades). */
  REMATCH_RECENCY_WINDOW: 12,
} as const;

/**
 * Random events — chance per event for each kind, plus knock-on effects.
 *
 * "Pre-event" events happen during card building (e.g. someone is injured and
 * pulls out, a replacement is booked). "Post-event" events happen after fights
 * (e.g. fame surge, retirement after big loss). "Roster-tick" events happen
 * during the aging tick (e.g. title strip for inactivity).
 */
export const RANDOM_EVENTS = {
  /** Per-card chance that one booked fight has a fighter pull out injured. */
  INJURY_PRE_EVENT_CHANCE: 0.18,
  /** Range of events the injured fighter is sidelined for. */
  INJURY_MIN_EVENTS: 2,
  INJURY_MAX_EVENTS: 5,
  /** Chance a replacement is found (otherwise the fight is scratched). */
  REPLACEMENT_FOUND_CHANCE: 0.7,

  /** Bonus fame after a 8.5+ epic win. */
  HYPE_BOOST_RATING_THRESHOLD: 8.5,
  HYPE_BOOST_FAME: 12,

  /** Title strip: champion missed this many events in a row → vacated. */
  TITLE_STRIP_INACTIVE_EVENTS: 4,

  /** Retirement: chance an old champion retires after a brutal loss. */
  RETIREMENT_AFTER_KO_LOSS_AGE: 33,
  RETIREMENT_AFTER_KO_LOSS_CHANCE: 0.35,

  /** Comeback: a retired (non-HOF) fighter at the right age may unretire. */
  COMEBACK_BASE_CHANCE: 0.015,   // ~1.5% per event among eligible
  COMEBACK_MIN_AGE: 30,
  COMEBACK_MAX_AGE: 36,

  /** Milestones tracked: career win count and title defenses. */
  MILESTONE_WINS: [10, 15, 20, 25],
  MILESTONE_DEFENSES: [3, 5, 7, 10],

  /** Post-fight call-out: high-rated fight + winner not yet champion. */
  CALL_OUT_RATING_THRESHOLD: 7.5,
  CALL_OUT_CHANCE: 0.45,
} as const;

/** Hard cap on news feed entries. Newest pushed to front. */
export const NEWS_FEED_CAP = 300;
