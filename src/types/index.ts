// ============================================================
// CORE TYPES
// ============================================================

export type Division = 'lightweight' | 'welterweight' | 'lightHeavyweight' | 'heavyweight';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Archetype = 'striker' | 'wrestler' | 'submission' | 'pressure' | 'tactical';

export type FightMethod = 'KO' | 'SUB' | 'DEC' | 'DOC';

export type FightResult = 'W' | 'L' | 'D';

/**
 * ISO 3166 alpha-2 country code. Used by <Flag /> to render an SVG flag.
 * (Switched from emoji because Chrome on Windows ships no emoji-flag font.)
 */
export type CountryCode = string;

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
  isMainEvent: boolean;
  division: Division;
  rating: number;
}

export interface Fighter {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  country: string;        // display name e.g. "Brazil"
  countryCode: CountryCode; // ISO code for flag rendering, e.g. "BR"
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
  /** Number of events the fighter is unable to compete (e.g. injured). Decrements each event. */
  injured: number;

  // NEW: derived game-feel metrics
  /** 0+, accumulates from wins/titles/streaks/famous opponents. Drives base fight rating. */
  fame: number;
  /** Sum of fight ratings of wins minus penalty for losses. Drives P4P (active) and GOAT (all). */
  careerPoints: number;

  // Logs
  fightLog: FightLogEntry[];
}

export interface TitleReignFightLog {
  eventNum: number;
  oppName: string;
  method: FightMethod;
  round: number;
  result: FightResult;
  rating: number;
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

// ============================================================
// RIVALRIES
// ============================================================

export interface RivalryMeeting {
  eventNum: number;
  eventName: string;
  winnerId: string;
  method: FightMethod;
  round: number;
  rating: number;
}

export interface Rivalry {
  id: string;             // canonical: smaller-id "_" larger-id
  fighterAId: string;     // lexicographically smaller of the two
  fighterBId: string;
  aWins: number;
  bWins: number;
  draws: number;
  meetings: RivalryMeeting[];
  totalRating: number;
  lastEventNum: number;
}

// ============================================================
// EVENT / CARD
// ============================================================

export interface CardFight {
  fAId: string;
  fBId: string;
  isTitleFight: boolean;
  isMainEvent: boolean;
  division: Division;
  isRivalry: boolean;     // pre-fight knowledge: have these two fought before?
  priorMeetings: number;  // count of prior meetings (for display)
}

export interface FightOutcome {
  winnerId: string;
  loserId: string;
  method: FightMethod;
  round: number;
  isTitleFight: boolean;
  roundsWonA: number;
  roundsWonB: number;
  rating: number;          // 1.00-9.99
  duration: string;        // e.g. "R2 3:12" or "Full 5R"
}

export interface EventFight {
  fA: Fighter;
  fB: Fighter;
  isTitleFight: boolean;
  isMainEvent: boolean;
  division: Division;
  isRivalry: boolean;
  priorMeetings: number;
  result: FightOutcome;
}

export interface EventArchiveEntry {
  num: number;
  kindNum: number;
  kind: EventKind;
  name: string;
  city: string;
  date: string;
  champions: Partial<Record<Division, string>>;
  topRating: number;       // highest fight rating from this event (for FOTN/FOTY)
  topFightSummary: string | null; // e.g. "Silva def. Santos (KO R2) — 8.45"
  /** Quick summary of the card: # fights, # title fights, headline */
  fightCount: number;
  titleFightCount: number;
  headline: string | null;
  /** Full per-fight summary for the archive view (lean — for storage). */
  fights: ArchivedFight[];
}

export interface ArchivedFight {
  fAId: string;
  fAName: string;
  fBId: string;
  fBName: string;
  winnerId: string;
  loserId: string;
  method: FightMethod;
  round: number;
  duration: string;
  rating: number;
  isTitleFight: boolean;
  isMainEvent: boolean;
  division: Division;
  priorMeetings: number;
  /** Ranks captured at the moment the card was built (pre-fight). */
  fARankBefore: string | null;  // "C", "1".."N", or null if unranked
  fBRankBefore: string | null;
}

/**
 * Event kinds:
 *   main     — once a month, headlines, 2 title fights + 5-6 contender fights (top 5)
 *   normal   — weekly weekend cards, mid-rank fights (typically ranks 5-12)
 *   prospect — mid-week (1st + 3rd Wed), bottom-half ranks (14+); auto-sim, archive-only
 */
export type EventKind = 'main' | 'normal' | 'prospect';

/** A fighter's rank at one point in time. Used by reveal UI to show rank changes. */
export type RankLabel = string | null;  // "C" | "1".."N" | null (unranked)

export interface RankChange {
  before: RankLabel;
  after: RankLabel;
}

export interface EventData {
  num: number;
  /** Per-kind sequence number (CL N for main, CN N for normal, PR N for prospect). */
  kindNum: number;
  kind: EventKind;
  name: string;
  city: string;
  date: string;
  fights: EventFight[];
  headline: string | null;
  /**
   * Rank changes by fighter id, captured between pre-event and post-event.
   * Populated during executeEvent. Used by the reveal modal.
   */
  rankChanges: Record<string, RankChange>;
}

/**
 * An event that's been prepared (card built, eventCount incremented, injury
 * countdown applied, pre-event injuries rolled) but whose fights have not yet
 * been executed. This is the state shown in the "Preview" stage of the UI.
 */
export interface PreparedEvent {
  num: number;
  kindNum: number;
  kind: EventKind;
  name: string;
  city: string;
  date: string;
  card: CardFight[];     // resolved matchups (after any injury swaps)
  /** Pre-fight rank snapshot for everyone on the card. */
  preRanks: Record<string, RankLabel>;
}

// ============================================================
// NEWS FEED / RANDOM EVENTS
// ============================================================

/**
 * NewsEntry kinds:
 *   injury           — pulled from upcoming card with injury
 *   replacement      — short-notice replacement booked
 *   hype-boost       — fame surge after epic win
 *   title-strip      — champion stripped (inactivity or non-title KO loss)
 *   retirement       — fighter retires (mid-career, after big loss, age-driven)
 *   comeback         — retired fighter unretires
 *   milestone        — career milestone (10 wins, 5 title defenses, etc.)
 *   fight-classic    — flagged for archive: a fight rated 9.0+
 *   debut            — notable prospect signs / debuts
 *   call-out         — post-fight call-out of a higher-ranked fighter (sets up rematch)
 */
export type NewsKind =
  | 'injury'
  | 'replacement'
  | 'hype-boost'
  | 'title-strip'
  | 'retirement'
  | 'comeback'
  | 'milestone'
  | 'fight-classic'
  | 'debut'
  | 'call-out';

export interface NewsEntry {
  id: string;
  eventNum: number;       // the event this is associated with (pre- or post-)
  kind: NewsKind;
  /** Display text shown in the feed. */
  text: string;
  /** Optional primary fighter (clickable in UI). */
  fighterId: string | null;
  /** Optional secondary fighter (e.g. replacement, opponent). */
  fighterBId: string | null;
}

// ============================================================
// ALL-TIME BEST FIGHTS
// ============================================================

export interface BestFightRecord {
  eventNum: number;
  eventName: string;
  division: Division;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  method: FightMethod;
  round: number;
  isTitleFight: boolean;
  rating: number;
}

export interface GameState {
  eventCount: number;
  /** Count of main (CL) events specifically. */
  mainEventCount: number;
  /** Count of normal (CN) events. */
  normalEventCount: number;
  /** Count of prospect (PR) events. */
  prospectEventCount: number;
  /** Per-division: event count at last time a fight from this division ran. */
  divisionLastFightEvent: Partial<Record<Division, number>>;
  fighters: Fighter[];
  titleHistory: TitleReign[];
  eventArchive: EventArchiveEntry[];
  lastEvent: EventData | null;

  // NEW
  rivalries: Record<string, Rivalry>;
  bestFightsAllTime: BestFightRecord[];     // bounded to top 50
  news: NewsEntry[];                         // bounded to ~300; newest-first when read
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
  prospectMax: number;
  primeMin: number;
  primeMax: number;
  retireRiskStart: number;
  retireRiskMax: number;
  finishRateMultiplier: number;
}

export interface Country {
  name: string;
  code: CountryCode;
}
