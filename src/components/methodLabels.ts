import type { FightMethod } from '@/types';
import type { IconName } from '@/icons';

export const METHOD_LABELS: Record<FightMethod, string> = {
  KO: 'KO/TKO',
  SUB: 'SUBMISSION',
  DEC: 'DECISION',
  DOC: 'DOC STOP',
};

export const METHOD_ICONS: Record<FightMethod, IconName> = {
  KO: 'knockout',
  SUB: 'submission',
  DEC: 'decision',
  DOC: 'doctorStop',
};
