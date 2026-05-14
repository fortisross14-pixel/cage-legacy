import type { Division } from '@/types';
import { DIVISION_KEYS, DIVISIONS } from '@/data';

interface Props {
  selected: Division;
  onSelect: (division: Division) => void;
}

export function DivisionTabs({ selected, onSelect }: Props) {
  return (
    <div className="div-tabs">
      {DIVISION_KEYS.map((d) => (
        <button
          key={d}
          data-div={d}
          className={`div-tab ${selected === d ? 'active' : ''}`}
          onClick={() => onSelect(d)}
        >
          {DIVISIONS[d].label}
        </button>
      ))}
    </div>
  );
}
