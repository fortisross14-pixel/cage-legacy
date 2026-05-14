// ============================================================
// CORE TYPES
// ============================================================

export type Division = 'lightweight' | 'welterweight' | 'lightHeavyweight' | 'heavyweight';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Archetype = 'striker' | 'wrestler' | 'submission' | 'pressure' | 'tactical';

export type FightMethod = 'KO' | 'SUB' | 'DEC' | 'DOC';

export type FightResult = 'W' | 'L' | 'D';

export interface FighterStats {
  striking: number;
  grappling: number;
  submission: number;
  cardio: number;
  durability: number;
  fightIQ: number;
}

export interface FightLogEntry {
  eventNum: number;
  eventName: string;
  oppId: string;
  oppName: string;
  result: FightResult;
  method: FightMethod;
  round: number;
  isTitleFight: boolean;
  division: Division;
}

export interface Fighter {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  country: string;
  flag: string;
  age: number;
  debutAge: number;
  rarity: Rarity;
  potential: number;
  archetype: Archetype;
  division: Division;
  stats: FighterStats;

  // Career record
  wins: number;
  losses: number;
  draws: number;
  koWins: number;
  subWins: number;
  decWins: number;
  koLosses: number;
  subLosses: number;
  decLosses: number;

  // Streaks
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;

  // Title
  titleReigns: number;
  titleDefenses: number;
  isChampion: boolean;
  becameChampAge: number | null;

  // Lifecycle
  retired: boolean;
  retirementReason: string | null;
  retiredAtEvent: number | null;
  hallOfFame: boolean;
  inactive: number;

  // Logs
  fightLog: FightLogEntry[];
}

export interface TitleReignFightLog {
  eventNum: number;
  oppName: string;
  method: FightMethod;
  round: number;
  result: FightResult;
}

export interface TitleReign {
  reignNum: number;
  division: Division;
  fighterId: string;
  fighterName: string;
  startEvent: number;
  startEventName: string;
  startAge: number;
  defenses: number;
  endEvent: number | null;
  endEventName: string | null;
  lostTo: string | null;
  fights: TitleReignFightLog[];
}

export interface CardFight {
  fAId: string;
  fBId: string;
  isTitleFight: boolean;
  isMainEvent: boolean;
  division: Division;
}

export interface FightOutcome {
  winnerId: string;
  loserId: string;
  method: FightMethod;
  round: number;
  isTitleFight: boolean;
  roundsWonA: number;
  roundsWonB: number;
}

export interface EventFight {
  fA: Fighter;
  fB: Fighter;
  isTitleFight: boolean;
  isMainEvent: boolean;
  division: Division;
  result: FightOutcome;
}

export interface EventArchiveEntry {
  num: number;
  name: string;
  city: string;
  date: string;
  champions: Partial<Record<Division, string>>;
}

export interface EventData {
  num: number;
  name: string;
  city: string;
  date: string;
  fights: EventFight[];
  headline: string | null;
}

export interface GameState {
  eventCount: number;
  fighters: Fighter[];
  titleHistory: TitleReign[];
  eventArchive: EventArchiveEntry[];
  lastEvent: EventData | null;
}

// ============================================================
// CONFIG TYPES
// ============================================================

export interface RarityConfig {
  weight: number;
  label: string;
  ceilMin: number;
  ceilMax: number;
}

export interface ArchetypeConfig {
  label: string;
  weights: FighterStats;
  finishBias: {
    ko: number;
    sub: number;
    dec: number;
  };
}

export interface DivisionConfig {
  label: string;
  shortLabel: string;
  // Heavier divisions age slower (per design doc)
  prospectMax: number;
  primeMin: number;
  primeMax: number;
  retireRiskStart: number;
  retireRiskMax: number;
  // Heavyweights finish more often
  finishRateMultiplier: number;
}

export interface Country {
  name: string;
  flag: string;
}
