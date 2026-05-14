/**
 * Icon Registry
 *
 * All icon usage in the app goes through this module so we have one place
 * to swap libraries (e.g. lucide-react → custom SVG) without touching components.
 *
 * Lucide icons are SVGs that accept color/size props and react naturally to
 * CSS (currentColor by default), so hover/active states "just work".
 *
 * Usage:
 *   import { Icon } from '@/icons';
 *   <Icon name="crown" size={20} />
 *   <Icon name="crown" className="text-gold" />     // inherits currentColor
 */
import {
  Crown,
  Trophy,
  Swords,
  Flame,
  Shield,
  Target,
  Activity,
  TrendingUp,
  Calendar,
  Users,
  History,
  ListOrdered,
  Home,
  Award,
  Skull,
  Heart,
  Zap,
  Dumbbell,
  Brain,
  Wind,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Star,
  Medal,
  ArrowRight,
  ArrowLeft,
  Sword,
  Clock,
  MapPin,
  type LucideProps,
} from 'lucide-react';

// App-specific icon names mapped to Lucide components.
// Use semantic names ("champion", "knockout") not library names ("crown", "flame")
// so the engine/concept doesn't leak into UI.
export const ICONS = {
  // Status / titles
  champion: Crown,
  trophy: Trophy,
  medal: Medal,
  star: Star,
  hallOfFame: Award,

  // Combat / outcomes
  fight: Swords,
  sword: Sword,
  knockout: Flame,
  submission: Brain,       // "mental" / technique
  decision: Activity,      // judges' scorecards feel
  doctorStop: Heart,
  killshot: Skull,

  // Attributes / stats (used in fighter profile bars)
  striking: Zap,
  grappling: Dumbbell,
  cardio: Wind,
  durability: Shield,
  fightIQ: Brain,
  submissionStat: Target,

  // Navigation
  home: Home,
  rankings: ListOrdered,
  history: History,
  records: TrendingUp,
  roster: Users,
  calendar: Calendar,
  location: MapPin,
  clock: Clock,

  // UI controls
  next: ChevronRight,
  prev: ChevronLeft,
  expand: ChevronDown,
  collapse: ChevronUp,
  close: X,
  search: Search,
  filter: Filter,
  play: Play,
  pause: Pause,
  reset: RotateCcw,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

/**
 * The Icon component. Defaults to currentColor so it inherits whatever color
 * the surrounding text has — that's what makes hover state changes "just work":
 *
 *   .tab        { color: var(--text-dim); }
 *   .tab:hover  { color: var(--gold); }
 *   <Icon name="champion" />  // changes color with the tab on hover
 */
export function Icon({ name, size = 18, strokeWidth = 2, ...rest }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} strokeWidth={strokeWidth} {...rest} />;
}
