import type {
  CardFight,
  Division,
  EventArchiveEntry,
  EventFight,
  EventKind,
  Fighter,
  FightOutcome,
  GameState,
  RankLabel,
  TitleReign,
} from '@/types';
import { CADENCE, DIVISION_KEYS, MATCHMAKING } from '@/data';
import { fullName } from './fighter';
import { priorMeetingsCount } from './rivalry';
import { chance, randInt } from './random';

// ============================================================
// RANKING SCORE
// ============================================================

/**
 * Ranking score — you earn your rank in the cage, not at the gym.
 *
 * Skill (overall) is intentionally NOT used. A new signing — even a legend —
 * starts with no fame, no record, and no career points, so they sit at the
 * bottom of the rankings (often unranked) until they prove themselves.
 *
 * Components (additive):
 *   - Career points (P4P score): accumulated rating-of-wins minus loss penalty.
 *   - Win/loss record: ratio and volume.
 *   - Recent streak: bonus for hot streaks, penalty for cold.
 *   - Title status: large bonus for champion, smaller for past reigns/defenses.
 *   - Fame: secondary contribution.
 *   - Inactivity penalty.
 *
 * Untested fighters (< 3 career fights) are penalized so they appear in
 * "unranked" rather than at the top of the division.
 */
export function calculateRankingScore(fighter: Fighter, allFighters: Fighter[]): number {
  if (fighter.retired) return -9999;

  let score = 0;
  const totalFights = fighter.wins + fighter.losses;

  // ─── Untested fighters: heavy penalty ───
  // Need ≥3 fights to register on the rankings at all. This means a brand-new
  // signing with 0-0 lands well below ranked fighters, regardless of skill.
  if (totalFights < 3) {
    score -= 200;
    // Still scale slightly by P4P/fame in case a vet was signed mid-career with priors
    score += fighter.careerPoints * 2;
    score += fighter.fame / 4;
    return score;
  }

  // ─── Career points (P4P) — primary signal ───
  // Each rated win sums into careerPoints. Higher quality + frequency = higher rank.
  score += fighter.careerPoints * 3.5;

  // ─── Record ratio + volume ───
  const winRate = fighter.wins / totalFights;
  // win rate 0.5 = neutral, 1.0 = +80, 0.0 = -80
  score += (winRate - 0.5) * 160;
  // Volume bonus: deeper careers get credit (cap at 40)
  score += Math.min(40, totalFights * 1.2);

  // ─── Recent momentum ───
  if (fighter.currentStreak > 0) score += Math.min(50, fighter.currentStreak * 7);
  if (fighter.currentStreak < 0) score += Math.max(-35, fighter.currentStreak * 6);

  // ─── Title status ───
  if (fighter.isChampion) score += 80;
  score += fighter.titleDefenses * 10;
  score += fighter.titleReigns * 14;

  // ─── Inactivity decay ───
  score -= fighter.inactive * 6;

  // ─── Quality of last 10 wins (by opponent fame, NOT skill) ───
  const recentWins = fighter.fightLog.slice(-10).filter((l) => l.result === 'W');
  for (const win of recentWins) {
    const opp = allFighters.find((f) => f.id === win.oppId);
    if (opp) score += Math.min(15, opp.fame / 8);
  }

  // ─── Fame contribution ───
  score += fighter.fame / 3;

  return score;
}

/**
 * Title-shot eligibility: a fighter must have a real résumé before competing for gold.
 * Used both for the vacant-belt matchup and the champion's contender selection.
 */
export function isTitleShotEligible(fighter: Fighter): boolean {
  if (fighter.retired) return false;
  if (fighter.injured > 0) return false;
  // Need at least 5 career fights with a winning record OR be already top of overall
  const totalFights = fighter.wins + fighter.losses;
  if (totalFights < 5) return false;
  const winRate = fighter.wins / Math.max(1, totalFights);
  if (winRate < 0.55) return false;
  // Recent: must have won at least 2 of last 4
  const recent = fighter.fightLog.slice(-4);
  const recentW = recent.filter((l) => l.result === 'W').length;
  if (recent.length >= 4 && recentW < 2) return false;
  return true;
}

export function getDivisionRankings(state: GameState, division: Division): Fighter[] {
  const eligible = state.fighters.filter((f) => !f.retired && f.division === division);
  const scored = eligible.map((f) => ({
    fighter: f,
    score: calculateRankingScore(f, state.fighters),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.fighter);
}

export function getChampion(state: GameState, division: Division): Fighter | null {
  return state.fighters.find((f) => f.isChampion && !f.retired && f.division === division) ?? null;
}

export function getTop10(state: GameState, division: Division): Fighter[] {
  const champ = getChampion(state, division);
  const ranked = getDivisionRankings(state, division).filter((f) => !champ || f.id !== champ.id);
  return ranked.slice(0, 10);
}

/**
 * Returns the rank label for a fighter in their division:
 *   "C"      — current champion
 *   "1".."N" — ranked challenger; #1 is the top contender, N is the bottom
 *   null     — only for retired fighters (active fighters always have a rank)
 *
 * Every active fighter in the division is ranked — no "unranked" tier.
 * A brand-new signing with no record sits at the very bottom of the ladder
 * and climbs by winning fights.
 */
export function getRankLabel(state: GameState, fighter: Fighter, maxRanked = 25): string | null {
  if (fighter.retired) return null;
  if (fighter.isChampion) return 'C';
  const ranked = getDivisionRankings(state, fighter.division);
  const champ = getChampion(state, fighter.division);
  const contenders = ranked.filter((f) => !champ || f.id !== champ.id);
  const idx = contenders.findIndex((f) => f.id === fighter.id);
  if (idx === -1 || idx >= maxRanked) return null;
  return String(idx + 1);
}

// ============================================================
// P4P (active) and GOAT (all-time) — based on careerPoints
// ============================================================

export function getP4PRankings(state: GameState, limit = 15): Fighter[] {
  return [...state.fighters]
    .filter((f) => !f.retired)
    .sort((a, b) => b.careerPoints - a.careerPoints)
    .slice(0, limit);
}

export function getGOATRankings(state: GameState, limit = 15): Fighter[] {
  return [...state.fighters]
    .sort((a, b) => b.careerPoints - a.careerPoints)
    .slice(0, limit);
}

// ============================================================
// CHAMPIONSHIP HANDLING
// ============================================================

interface TitleHandlerInput {
  state: GameState;
  fightFighters: { fA: Fighter; fB: Fighter };
  result: FightOutcome;
  eventInfo: { num: number; name: string };
  division: Division;
}

export function handleTitleResult({
  state,
  fightFighters,
  result,
  eventInfo,
  division,
}: TitleHandlerInput): void {
  const { fA, fB } = fightFighters;
  const champ = fA.isChampion ? fA : fB.isChampion ? fB : null;
  const challenger = champ ? (fA === champ ? fB : fA) : null;

  if (champ && challenger) {
    if (result.winnerId === champ.id) {
      // Successful defense
      champ.titleDefenses++;
      const currentReign = state.titleHistory.find(
        (r) => r.fighterId === champ.id && r.division === division && !r.endEvent
      );
      if (currentReign) {
        currentReign.defenses = champ.titleDefenses;
        currentReign.fights.push({
          eventNum: eventInfo.num,
          oppName: fullName(challenger),
          method: result.method,
          round: result.round,
          result: 'W',
          rating: result.rating,
        });
      }
    } else {
      // Title changes hands
      champ.isChampion = false;
      const oldReign = state.titleHistory.find(
        (r) => r.fighterId === champ.id && r.division === division && !r.endEvent
      );
      if (oldReign) {
        oldReign.endEvent = eventInfo.num;
        oldReign.endEventName = eventInfo.name;
        oldReign.lostTo = fullName(challenger);
      }
      crownChampion(state, challenger, eventInfo, division);
    }
  } else {
    // Vacant title fight
    const winner = result.winnerId === fA.id ? fA : fB;
    crownChampion(state, winner, eventInfo, division);
  }
}

function crownChampion(
  state: GameState,
  fighter: Fighter,
  eventInfo: { num: number; name: string },
  division: Division
): void {
  fighter.isChampion = true;
  fighter.titleReigns++;
  fighter.becameChampAge = fighter.age;

  const divisionReigns = state.titleHistory.filter((r) => r.division === division).length;
  const newReign: TitleReign = {
    reignNum: divisionReigns + 1,
    division,
    fighterId: fighter.id,
    fighterName: fullName(fighter),
    startEvent: eventInfo.num,
    startEventName: eventInfo.name,
    startAge: fighter.age,
    defenses: 0,
    endEvent: null,
    endEventName: null,
    lostTo: null,
    fights: [],
  };
  state.titleHistory.unshift(newReign);
}

export function handleChampionRetirements(state: GameState): void {
  for (const f of state.fighters) {
    if (f.isChampion && f.retired) {
      f.isChampion = false;
      const reign = state.titleHistory.find(
        (r) => r.fighterId === f.id && r.division === f.division && !r.endEvent
      );
      if (reign) {
        reign.endEvent = state.eventCount;
        reign.endEventName = '(vacated on retirement)';
        reign.lostTo = '— (vacated)';
      }
    }
  }
}

// ============================================================
// MATCHMAKING — PER DIVISION (rivalry-aware + injury-aware + kind-aware)
// ============================================================

export interface BuildCardOptions {
  kind: EventKind;
}

/**
 * Build a fight card for the given event kind.
 *
 * Each kind has its own matchmaking rules:
 *
 *   MAIN  — Champion vs #1 contender (always, marquee division).
 *           85% chance of a second title fight in another division.
 *           5-6 contender fights drawn from ranks #2-#7 across divisions.
 *           Champions ONLY fight here.
 *
 *   NORMAL — No champions, no title fights.
 *            ~6 fights from ranks #5-#12 across divisions.
 *            Sometimes a fight stretches to include #3-#4 or #13-#14.
 *
 *   PROSPECT — Bottom-half ranks (#13+). ~10 fights.
 *              Auto-simmed without UI by default.
 */
export function buildEventCard(
  state: GameState,
  opts: BuildCardOptions = { kind: 'normal' }
): CardFight[] {
  const { kind } = opts;
  const card: CardFight[] = [];
  const used = new Set<string>();
  const eventNum = state.eventCount + 1;

  if (kind === 'main') {
    buildMainCard(state, card, used, eventNum);
  } else if (kind === 'normal') {
    buildNormalCard(state, card, used, eventNum);
  } else {
    buildProspectCard(state, card, used, eventNum);
  }

  // Tag inactivity (only for fighters not in this card and not injured)
  for (const f of state.fighters) {
    if (!f.retired && !used.has(f.id) && f.injured === 0) f.inactive++;
  }

  // Bump last-fight tracker per division for everyone IN the card
  const divsOnCard = new Set(card.map((c) => c.division));
  for (const div of divsOnCard) {
    state.divisionLastFightEvent[div] = eventNum;
  }

  // Sort: main event first, then title fights, then division order
  card.sort((a, b) => {
    if (a.isMainEvent && !b.isMainEvent) return -1;
    if (!a.isMainEvent && b.isMainEvent) return 1;
    if (a.isTitleFight && !b.isTitleFight) return -1;
    if (!a.isTitleFight && b.isTitleFight) return 1;
    return DIVISION_KEYS.indexOf(a.division) - DIVISION_KEYS.indexOf(b.division);
  });

  return card;
}

// ============================================================
// MAIN CARD BUILDER
// ============================================================
function buildMainCard(
  state: GameState,
  card: CardFight[],
  used: Set<string>,
  eventNum: number
): void {
  // Pick the marquee title division (rotation)
  const mainDivision = chooseMainDivision(state, eventNum);

  // Possibly add a second title fight
  const secondTitleDivision = chance(CADENCE.MAIN_SECOND_TITLE_CHANCE)
    ? pickSecondTitleDivision(state, mainDivision)
    : null;

  // Book title fights first
  bookTitleFightFor(state, mainDivision, card, used, true);
  if (secondTitleDivision) {
    bookTitleFightFor(state, secondTitleDivision, card, used, false);
  }

  // Now book contender fights from ranks #2-#7 across divisions
  const target = CADENCE.MAIN_FIGHT_TARGET;
  let attempts = 0;
  while (card.length < target && attempts < 30) {
    attempts++;
    // Pick a division — prefer ones not yet on the card
    const division = pickContenderDivision(state, card);
    if (!division) break;
    const added = bookContenderFightInBand(
      state,
      division,
      card,
      used,
      eventNum,
      CADENCE.MAIN_CONTENDER_RANK_MIN,
      CADENCE.MAIN_CONTENDER_RANK_MAX
    );
    if (!added) {
      // This division ran out of contender pairs — try another
      continue;
    }
  }
}

/** Book one title fight in the given division. Returns true on success. */
function bookTitleFightFor(
  state: GameState,
  division: Division,
  card: CardFight[],
  used: Set<string>,
  isMainEvent: boolean
): boolean {
  const champ = getChampion(state, division);
  // Champion must be available
  if (champ && isUnavailable(champ)) return false;

  if (champ) {
    // Find contender #1 (top of division excluding champ)
    const contenders = getDivisionRankings(state, division).filter(
      (f) => f.id !== champ.id && !isUnavailable(f) && !used.has(f.id)
    );
    if (contenders.length === 0) return false;
    const recent = new Set(champ.fightLog.slice(-3).map((l) => l.oppId));
    // Prefer #1 contender if they're not a too-recent opponent
    let contender = contenders.find((f) => !recent.has(f.id)) ?? contenders[0];
    // Eligibility: must have a winning record + 5+ fights, otherwise fall back to next
    const eligible = contenders.filter((f) => isTitleShotEligible(f) && !recent.has(f.id));
    if (eligible.length > 0) contender = eligible[0];
    card.push(makeCardFight(state, champ, contender, true, isMainEvent, division));
    used.add(champ.id);
    used.add(contender.id);
    return true;
  } else {
    // Vacant belt: top 2 eligible by ranking
    const available = getDivisionRankings(state, division).filter(
      (f) => !isUnavailable(f) && !used.has(f.id)
    );
    if (available.length < 2) return false;
    const eligible = available.filter(isTitleShotEligible);
    const [a, b] = eligible.length >= 2 ? eligible.slice(0, 2) : available.slice(0, 2);
    if (!a || !b || a.id === b.id) return false;
    card.push(makeCardFight(state, a, b, true, isMainEvent, division));
    used.add(a.id);
    used.add(b.id);
    return true;
  }
}

/** Pick the division for a second title fight (with an available champ + contender,
 *  OR a vacant belt with 2 available fighters). */
function pickSecondTitleDivision(state: GameState, mainDiv: Division): Division | null {
  const others = DIVISION_KEYS.filter((d) => d !== mainDiv);
  for (const d of others.sort(() => Math.random() - 0.5)) {
    const champ = getChampion(state, d);
    if (champ && !isUnavailable(champ)) {
      const ranked = getDivisionRankings(state, d).filter(
        (f) => f.id !== champ.id && !isUnavailable(f)
      );
      if (ranked.length > 0) return d;
    } else if (!champ) {
      // Vacant belt — book it if there are 2 available fighters
      const available = getDivisionRankings(state, d).filter((f) => !isUnavailable(f));
      if (available.length >= 2) return d;
    }
  }
  return null;
}

/** Choose which division to draw the next contender fight from. */
function pickContenderDivision(state: GameState, card: CardFight[]): Division | null {
  // Prefer the division with the fewest fights on the card so far
  const divCounts: Record<Division, number> = {} as Record<Division, number>;
  for (const div of DIVISION_KEYS) divCounts[div] = 0;
  for (const f of card) divCounts[f.division]++;
  return [...DIVISION_KEYS].sort((a, b) => divCounts[a] - divCounts[b])[0] ?? null;
}

/**
 * Book one fight where both fighters fall within the given rank band of their division.
 * Champions are excluded. Returns true if a fight was booked.
 */
function bookContenderFightInBand(
  state: GameState,
  division: Division,
  card: CardFight[],
  used: Set<string>,
  eventNum: number,
  rankMin: number,
  rankMax: number
): boolean {
  const champ = getChampion(state, division);
  // Get contenders ordered by ranking (excluding champ, injured, retired, already used)
  const allRanked = getDivisionRankings(state, division).filter(
    (f) =>
      !f.retired &&
      !isUnavailable(f) &&
      (!champ || f.id !== champ.id) &&
      !used.has(f.id)
  );
  // Slice the rank band: ranks are 1-indexed, allRanked[0] is rank 1
  const minIdx = Math.max(0, rankMin - 1);
  const maxIdx = Math.min(allRanked.length - 1, rankMax - 1);
  const band = allRanked.slice(minIdx, maxIdx + 1);
  if (band.length < 2) return false;

  // ── Recent-fight cooldown ──
  // Top tier fighters need rest and marquee buildup; prospects need fights.
  // Use a longer cooldown for narrow (main/normal) bands and a short one for
  // wide (prospect) bands.
  const isWideBand = rankMin >= 13;
  const COOLDOWN = isWideBand
    ? CADENCE.PROSPECT_COOLDOWN_EVENTS
    : CADENCE.CONTENDER_COOLDOWN_EVENTS;
  const lastEventNumForFighter = (f: Fighter): number => {
    if (f.fightLog.length === 0) return -999;
    return f.fightLog[f.fightLog.length - 1].eventNum;
  };
  const isFresh = (f: Fighter) => eventNum - lastEventNumForFighter(f) > COOLDOWN;
  const fresh = band.filter(isFresh);
  // If we have at least 2 fresh, only consider fresh. Otherwise fall back to full band.
  const pool = fresh.length >= 2 ? fresh : band;

  // Pick "top" of the pool — but for prospect-style wide bands (rankMin >= 13),
  // sample uniformly across the whole pool so deep-ranked fighters (including
  // fresh hires sitting at the very bottom) actually get booked. For narrow
  // bands (main/normal cards), keep the bias toward the top of the band so
  // credibility is preserved.
  let topIdx = 0;
  if (isWideBand && pool.length >= 3) {
    topIdx = randInt(0, pool.length - 1);
  } else if (pool.length >= 3 && chance(0.5)) {
    topIdx = randInt(0, Math.min(2, pool.length - 1));
  }
  const top = pool[topIdx];
  const rest = pool.filter((_, i) => i !== topIdx);
  const recentOpps = new Set(top.fightLog.slice(-2).map((l) => l.oppId));

  let oppIdx = findRematchCandidateInList(state, top, rest, recentOpps, eventNum);
  if (oppIdx === -1) {
    oppIdx = rest.findIndex((f) => !recentOpps.has(f.id));
    if (oppIdx === -1) oppIdx = 0;
    if (oppIdx + 1 < rest.length && chance(0.4)) {
      oppIdx = Math.min(rest.length - 1, oppIdx + randInt(1, 2));
    }
  }
  const opp = rest[oppIdx];
  if (!opp) return false;

  card.push(makeCardFight(state, top, opp, false, false, division));
  used.add(top.id);
  used.add(opp.id);
  return true;
}

/**
 * Same as findRematchCandidate but works on a plain Fighter[] (the band).
 */
function findRematchCandidateInList(
  state: GameState,
  topFighter: Fighter,
  pool: Fighter[],
  recentOpps: Set<string>,
  eventNum: number
): number {
  const candidates: { idx: number; weight: number; trilogy: boolean }[] = [];
  for (let i = 0; i < pool.length; i++) {
    const opp = pool[i];
    if (recentOpps.has(opp.id)) continue;
    const rivalry = getRivalryRaw(state, topFighter.id, opp.id);
    if (!rivalry || rivalry.meetings.length === 0) continue;
    const lastMeeting = rivalry.meetings[rivalry.meetings.length - 1];
    const eventsSince = eventNum - lastMeeting.eventNum;
    if (eventsSince < MATCHMAKING.REMATCH_COOLDOWN_EVENTS) continue;
    if (eventsSince > MATCHMAKING.REMATCH_RECENCY_WINDOW) continue;
    if (lastMeeting.rating < MATCHMAKING.REMATCH_MIN_RATING) continue;
    const isTrilogy =
      rivalry.meetings.length === 2 && rivalry.aWins === 1 && rivalry.bWins === 1;
    let weight: number = MATCHMAKING.REMATCH_BASE_CHANCE;
    if (lastMeeting.method === 'DEC') weight *= MATCHMAKING.REMATCH_CLOSE_MULT;
    if (isTrilogy) weight = MATCHMAKING.TRILOGY_CHANCE;
    candidates.push({ idx: i, weight, trilogy: isTrilogy });
  }
  if (candidates.length === 0) return -1;
  candidates.sort((a, b) => {
    if (a.trilogy && !b.trilogy) return -1;
    if (!a.trilogy && b.trilogy) return 1;
    return b.weight - a.weight;
  });
  const best = candidates[0];
  if (!chance(best.weight)) return -1;
  return best.idx;
}

// ============================================================
// NORMAL CARD BUILDER
// ============================================================
function buildNormalCard(
  state: GameState,
  card: CardFight[],
  used: Set<string>,
  eventNum: number
): void {
  const target = CADENCE.NORMAL_FIGHT_TARGET;
  let attempts = 0;
  while (card.length < target && attempts < 30) {
    attempts++;
    const division = pickContenderDivision(state, card);
    if (!division) break;
    // Stretch the band downward only (toward 13-14). Top contenders (#3-4)
    // are reserved for main events — they don't appear on normal cards.
    let rankMin: number = CADENCE.NORMAL_RANK_MIN;
    let rankMax: number = CADENCE.NORMAL_RANK_MAX;
    if (chance(CADENCE.NORMAL_STRETCH_CHANCE)) {
      rankMax = rankMax + 2;
    }
    const added = bookContenderFightInBand(
      state,
      division,
      card,
      used,
      eventNum,
      rankMin,
      rankMax
    );
    if (!added) continue;
  }
}

// ============================================================
// PROSPECT CARD BUILDER
// ============================================================
function buildProspectCard(
  state: GameState,
  card: CardFight[],
  used: Set<string>,
  eventNum: number
): void {
  const target = CADENCE.PROSPECT_FIGHT_TARGET;
  let attempts = 0;
  while (card.length < target && attempts < 40) {
    attempts++;
    const division = pickContenderDivision(state, card);
    if (!division) break;
    const added = bookContenderFightInBand(
      state,
      division,
      card,
      used,
      eventNum,
      CADENCE.PROSPECT_RANK_MIN,
      9999 // open-ended at the bottom
    );
    if (!added) continue;
  }
}


/** Raw rivalry lookup (avoids circular import; mirrors rivalry.getRivalry). */
function getRivalryRaw(state: GameState, idA: string, idB: string) {
  const id = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
  return state.rivalries[id] ?? null;
}

/** A fighter is unavailable to be booked if currently injured (or otherwise). */
function isUnavailable(f: Fighter): boolean {
  return f.injured > 0;
}

function makeCardFight(
  state: GameState,
  fA: Fighter,
  fB: Fighter,
  isTitleFight: boolean,
  isMainEvent: boolean,
  division: Division
): CardFight {
  const prior = priorMeetingsCount(state, fA.id, fB.id);
  return {
    fAId: fA.id,
    fBId: fB.id,
    isTitleFight,
    isMainEvent,
    division,
    isRivalry: prior >= 1,
    priorMeetings: prior,
  };
}

function chooseMainDivision(state: GameState, eventNum: number): Division {
  const isAvailable = (f: Fighter) => !f.retired && f.injured === 0;

  // Prefer divisions with a vacant belt — get them filled.
  const vacantDivs = DIVISION_KEYS.filter((d) => {
    const c = getChampion(state, d);
    if (c) return false;
    const r = getDivisionRankings(state, d).filter(isAvailable);
    return r.length >= 2;
  });
  if (vacantDivs.length > 0) {
    // Among vacant, rotate by mainEventCount so we don't always pick the same one
    return vacantDivs[state.mainEventCount % vacantDivs.length];
  }

  // Otherwise, rotate among all divisions based on main-event count (not raw eventNum,
  // which includes prospects/normals).
  const rotation = DIVISION_KEYS[state.mainEventCount % DIVISION_KEYS.length];
  const champ = getChampion(state, rotation);
  const ranked = getDivisionRankings(state, rotation).filter(
    (f) => isAvailable(f) && (!champ || f.id !== champ.id)
  );
  if ((champ && isAvailable(champ) && ranked.length > 0) || ranked.length >= 2) return rotation;

  // Last resort: fall back to any division with enough fighters
  for (const div of DIVISION_KEYS) {
    const c = getChampion(state, div);
    const r = getDivisionRankings(state, div).filter(
      (f) => isAvailable(f) && (!c || f.id !== c.id)
    );
    if ((c && isAvailable(c) && r.length > 0) || r.length >= 2) return div;
  }
  // Mark unused parameter
  void eventNum;
  return rotation;
}

// ============================================================
// EVENT ARCHIVE — full per-fight snapshot for archive view
// ============================================================

export function buildEventArchiveEntry(
  state: GameState,
  num: number,
  kindNum: number,
  kind: EventKind,
  name: string,
  city: string,
  date: string,
  fights: EventFight[],
  headline: string | null = null,
  preRanks: Record<string, RankLabel> = {}
): EventArchiveEntry {
  const champions: Partial<Record<Division, string>> = {};
  for (const div of DIVISION_KEYS) {
    const c = getChampion(state, div);
    if (c) champions[div] = fullName(c);
  }

  // Top fight of the night
  let topRating = 0;
  let topFightSummary: string | null = null;
  if (fights.length > 0) {
    const top = [...fights].sort((a, b) => b.result.rating - a.result.rating)[0];
    topRating = top.result.rating;
    const winner = top.result.winnerId === top.fA.id ? top.fA : top.fB;
    const loser = top.result.winnerId === top.fA.id ? top.fB : top.fA;
    const methodStr = top.result.method === 'DEC'
      ? `DEC`
      : `${top.result.method} R${top.result.round}`;
    topFightSummary = `${fullName(winner)} def. ${fullName(loser)} (${methodStr}) — ${topRating.toFixed(2)}`;
  }

  // Compact per-fight snapshot
  const archivedFights = fights.map((f) => ({
    fAId: f.fA.id,
    fAName: fullName(f.fA),
    fBId: f.fB.id,
    fBName: fullName(f.fB),
    winnerId: f.result.winnerId,
    loserId: f.result.winnerId === f.fA.id ? f.fB.id : f.fA.id,
    method: f.result.method,
    round: f.result.round,
    duration: f.result.duration,
    rating: f.result.rating,
    isTitleFight: f.isTitleFight,
    isMainEvent: f.isMainEvent,
    division: f.division,
    priorMeetings: f.priorMeetings,
    fARankBefore: preRanks[f.fA.id] ?? null,
    fBRankBefore: preRanks[f.fB.id] ?? null,
  }));

  const titleFightCount = fights.filter((f) => f.isTitleFight).length;

  return {
    num,
    kindNum,
    kind,
    name,
    city,
    date,
    champions,
    topRating,
    topFightSummary,
    fightCount: fights.length,
    titleFightCount,
    headline,
    fights: archivedFights,
  };
}
