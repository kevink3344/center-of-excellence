import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { PageHead, Panel, Badge } from '@/components/ui';
import { changeStatusLabel, changeStatusBadge, changePriorityBadge } from '@/lib/format';
import { api } from '@/lib/api';
import type { ChangeRequestListItem, ChangeWindow } from '@/lib/api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ChangeCalendar() {
  const navigate = useNavigate();
  const [changes, setChanges] = useState<ChangeRequestListItem[]>([]);
  const [windows, setWindows] = useState<ChangeWindow[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.getChangeCalendar()
      .then((r) => {
        setChanges(r.data.changes);
        setWindows(r.data.windows);
      })
      .catch(() => { setChanges([]); setWindows([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Build the month grid ──
  const grid = useMemo(() => {
    const { year, month: monthIndex } = month;
    const first = new Date(year, monthIndex, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: { date: Date; iso: string; inMonth: boolean }[] = [];
    // Leading days from previous month (blank slate, not clickable)
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(year, monthIndex, i - startWeekday + 1);
      cells.push({ date: d, iso: isoDay(d), inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, monthIndex, day);
      cells.push({ date: d, iso: isoDay(d), inMonth: true });
    }
    return cells;
  }, [month]);

  const changeByDay = useMemo(() => {
    const map = new Map<string, ChangeRequestListItem[]>();
    for (const c of changes) {
      if (!c.plannedStartAt && !c.plannedEndAt) continue;
      const start = c.plannedStartAt ? new Date(c.plannedStartAt) : null;
      const end = c.plannedEndAt ? new Date(c.plannedEndAt) : null;
      if (!start) continue;
      const key = isoDay(start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [changes]);

  const windowByDay = useMemo(() => {
    const map = new Map<string, ChangeWindow[]>();
    for (const w of windows) {
      let d = new Date(w.startAt);
      const end = new Date(w.endAt);
      while (d <= end) {
        const key = isoDay(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(w);
        d = new Date(d.getTime() + 86400000);
      }
    }
    return map;
  }, [windows]);

  const monthLabel = new Date(month.year, month.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dayChanges = selectedDay ? (changeByDay.get(selectedDay) ?? []) : [];
  const dayWindows = selectedDay ? (windowByDay.get(selectedDay) ?? []) : [];

  function shiftMonth(delta: number) {
    setMonth((m) => {
      const d = new Date(m.year, m.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDay(null);
  }

  function isoDay(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return (
    <>
      <PageHead
        title="Change Calendar"
        sub="Scheduled changes and maintenance windows."
        actions={
          <button className="secondary-button" onClick={() => navigate('/change')}>
            <ArrowLeft size={14} /> Change Board
          </button>
        }
      />

      <Panel title="Month View" actions={
        <div className="row" style={{ margin: 0 }}>
          <button className="icon-button" onClick={() => shiftMonth(-1)} type="button" aria-label="Previous month"><ChevronLeft size={16} /></button>
          <span className="cell-title" style={{ minWidth: 130, textAlign: 'center' }}>{monthLabel}</span>
          <button className="icon-button" onClick={() => shiftMonth(1)} type="button" aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      }>
        {loading ? (
          <div className="ai-result-loading"><span className="spinner" /> Loading calendar…</div>
        ) : (
          <>
            <div className="cal-weekdays">
              {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="cal-grid">
              {grid.map((cell, i) => {
                const hasFreeze = (windowByDay.get(cell.iso) ?? []).some((w) => w.kind === 'freeze');
                const hasWindow = (windowByDay.get(cell.iso) ?? []).length > 0;
                const hasChange = (changeByDay.get(cell.iso) ?? []).length > 0;
                return (
                  <button
                    key={i}
                    type="button"
                    className="cal-cell"
                    data-inmonth={cell.inMonth}
                    data-selected={selectedDay === cell.iso}
                    data-freeze={hasFreeze}
                    onClick={() => cell.inMonth && setSelectedDay(cell.iso)}
                  >
                    <span className="cal-daynum">{cell.date.getDate()}</span>
                    <span className="cal-dots">
                      {hasWindow && <span className="cal-dot" data-kind={hasFreeze ? 'freeze' : 'window'} />}
                      {hasChange && <span className="cal-dot" data-kind="change" />}
                    </span>
                  </button>
                );
              })}
              {/* trailing days to complete the last week */}
              {grid.length % 7 !== 0 && Array.from({ length: 7 - (grid.length % 7) }).map((_, i) => (
                <div key={`trail-${i}`} className="cal-cell" data-inmonth={false} />
              ))}
            </div>

            <div className="row" style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <span><span className="cal-dot" data-kind="window" /> Maintenance window</span>
              <span><span className="cal-dot" data-kind="freeze" /> Freeze</span>
              <span><span className="cal-dot" data-kind="change" /> Change</span>
            </div>

            {selectedDay && (
              <div className="grid-2" style={{ marginTop: 16 }}>
                <Panel title={`Windows · ${selectedDay}`}>
                  {dayWindows.length === 0 ? (
                    <div className="ai-result-empty"><div style={{ fontSize: 24, marginBottom: 6 }}>🪟</div>No windows.</div>
                  ) : (
                    <div className="stack">
                      {dayWindows.map((w) => (
                        <div key={w.id} className="surface" style={{ padding: 10 }}>
                          <Badge className={w.kind === 'freeze' ? 'badge-red' : 'badge-slate'}>{w.kind}</Badge>{' '}
                          <span className="cell-title">{w.name}</span>
                          <div className="cell-sub">{w.startAt.slice(0, 10)} → {w.endAt.slice(0, 10)}{w.scope ? ` · ${w.scope}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
                <Panel title={`Changes · ${selectedDay}`}>
                  {dayChanges.length === 0 ? (
                    <div className="ai-result-empty"><div style={{ fontSize: 24, marginBottom: 6 }}>📅</div>No scheduled changes.</div>
                  ) : (
                    <div className="stack">
                      {dayChanges.map((c) => (
                        <div key={c.id} className="surface" style={{ padding: 10, cursor: 'pointer' }} onClick={() => navigate(`/change/${c.id}`)}>
                          <div className="cell-title">{c.title}</div>
                          <div className="cell-sub">
                            <Badge className={changePriorityBadge(c.priority)}>{c.priority}</Badge>{' '}
                            <Badge className={changeStatusBadge(c.status)}>{changeStatusLabel(c.status)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
