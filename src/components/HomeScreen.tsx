import { useState } from 'react';
import type { UniverseMeta } from '@/state/useUniverses';
import { Icon } from '@/icons';

interface Props {
  universes: UniverseMeta[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => string;     // returns new slot id
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function HomeScreen({ universes, onSelect, onCreate, onRename, onDelete }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const sortedUniverses = [...universes].sort(
    (a, b) => b.lastPlayedAt - a.lastPlayedAt
  );

  const handleCreate = () => {
    const id = onCreate(newName || `Universe ${universes.length + 1}`);
    setNewName('');
    setCreating(false);
    onSelect(id);
  };

  const handleRename = (id: string) => {
    onRename(id, renameValue);
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = (u: UniverseMeta) => {
    if (
      confirm(
        `Delete "${u.name}" (${u.eventCount} events)?\n\nThis cannot be undone.`
      )
    ) {
      onDelete(u.id);
    }
  };

  return (
    <div className="home-screen">
      <div className="home-hero">
        <div className="home-logo">
          <Icon name="fight" size={36} />
        </div>
        <h1 className="home-title">CAGE LEGACY</h1>
        <div className="home-subtitle">Manage your own MMA universe.</div>
      </div>

      <div className="home-section">
        <div className="home-section-header">
          <h2>Your Universes</h2>
          {!creating && (
            <button className="btn-primary btn-compact" onClick={() => setCreating(true)}>
              <Icon name="comeback" size={14} />
              New Universe
            </button>
          )}
        </div>

        {creating && (
          <div className="home-create">
            <input
              type="text"
              className="home-input"
              placeholder="Universe name (e.g. 'Cage Legacy: Alpha')"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setCreating(false);
                  setNewName('');
                }
              }}
              autoFocus
              maxLength={48}
            />
            <button className="btn-primary btn-compact" onClick={handleCreate}>
              <Icon name="play" size={14} />
              Create
            </button>
            <button
              className="btn-ghost btn-compact"
              onClick={() => {
                setCreating(false);
                setNewName('');
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {sortedUniverses.length === 0 && !creating ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="fight" size={28} />
            </div>
            <h3>No universes yet</h3>
            <p>Create your first universe to start the legacy.</p>
            <button
              className="btn-primary"
              onClick={() => setCreating(true)}
              style={{ marginTop: 14 }}
            >
              <Icon name="comeback" size={16} />
              Create Universe
            </button>
          </div>
        ) : (
          <div className="universe-list">
            {sortedUniverses.map((u) => (
              <div className="universe-card" key={u.id}>
                {renamingId === u.id ? (
                  <input
                    type="text"
                    className="home-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(u.id);
                      if (e.key === 'Escape') {
                        setRenamingId(null);
                        setRenameValue('');
                      }
                    }}
                    onBlur={() => handleRename(u.id)}
                    autoFocus
                    maxLength={48}
                  />
                ) : (
                  <button
                    className="universe-card-main"
                    onClick={() => onSelect(u.id)}
                  >
                    <div className="universe-name">{u.name}</div>
                    <div className="universe-meta">
                      <span>
                        <Icon name="fight" size={11} />
                        {u.eventCount} {u.eventCount === 1 ? 'event' : 'events'}
                      </span>
                      <span className="sub-divider" />
                      <span>{relativeTime(u.lastPlayedAt)}</span>
                    </div>
                  </button>
                )}
                <div className="universe-card-actions">
                  <button
                    className="icon-btn"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(u.id);
                      setRenameValue(u.name);
                    }}
                  >
                    <Icon name="filter" size={14} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(u);
                    }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
