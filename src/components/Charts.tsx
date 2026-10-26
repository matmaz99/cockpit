/**
 * Two small server-rendered charts for the dashboard, in graphite (green is reserved for
 * solar in the design system): daily bars with a native tooltip on each bar, and a
 * horizontal funnel. One series each, so no legend box; the title names the measure.
 */

const fr = (n: number) => n.toLocaleString('fr-FR');

export function DailyBars({ title, data, unit }: { title: string; data: { day: string; value: number }[]; unit: string }) {
  const W = 640;
  const H = 150;
  const max = Math.max(1, ...data.map((d) => d.value));
  const gap = 2;
  const bw = Math.max(2, (W - gap * (data.length - 1)) / data.length);
  const total = data.reduce((a, d) => a + d.value, 0);
  const label = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return (
    <figure className="sp-chart">
      <figcaption className="sp-chart__head"><span className="sp-label">{title}</span><span className="sp-data-sm">{fr(total)} {unit} sur la période · max {fr(max)} par jour</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label={`${title} par jour`}>
        <line x1={0} x2={W} y1={H} y2={H} className="sp-chart__axis" />
        {data.map((d, i) => {
          const h = d.value ? Math.max(3, (d.value / max) * (H - 8)) : 0;
          const x = i * (bw + gap);
          return (
            <g key={d.day}>
              <rect x={x} y={0} width={bw} height={H} className="sp-chart__hit"><title>{`${label(d.day)} : ${fr(d.value)} ${unit}`}</title></rect>
              {h > 0 && <path className="sp-chart__bar" d={`M${x},${H} V${H - h + 4} q0,-4 4,-4 h${Math.max(0, bw - 8)} q4,0 4,4 V${H} Z`}><title>{`${label(d.day)} : ${fr(d.value)} ${unit}`}</title></path>}
            </g>
          );
        })}
        <text x={0} y={H + 14} className="sp-chart__tick">{label(data[0]?.day ?? new Date().toISOString())}</text>
        <text x={W} y={H + 14} textAnchor="end" className="sp-chart__tick">{label(data[data.length - 1]?.day ?? new Date().toISOString())}</text>
      </svg>
    </figure>
  );
}

export function Funnel({ steps }: { steps: { label: string; visitors: number }[] }) {
  const max = Math.max(1, steps[0]?.visitors ?? 1);
  return (
    <div className="sp-funnel">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].visitors : null;
        const rate = prev ? Math.round((100 * s.visitors) / Math.max(1, prev)) : null;
        return (
          <div key={s.label} className="sp-funnel__row" title={`${s.label} : ${fr(s.visitors)} visiteurs`}>
            <span className="sp-funnel__label">{s.label}</span>
            <span className="sp-funnel__track"><span className="sp-funnel__bar" style={{ width: `${Math.max(s.visitors ? 1.5 : 0, (100 * s.visitors) / max)}%` }} /></span>
            <span className="sp-funnel__val">{fr(s.visitors)}</span>
            <span className="sp-funnel__rate">{rate === null ? '' : `${rate} %`}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CountTable({ title, rows, keyLabel, empty = 'Rien encore.' }: { title: string; rows: { key: string; n: number; visitors?: number }[]; keyLabel: string; empty?: string }) {
  return (
    <section className="sp-admin-card">
      <div className="sp-label">{title}</div>
      {rows.length ? (
        <table className="sp-table">
          <thead><tr><th>{keyLabel}</th><th className="num">Nombre</th><th className="num">Visiteurs</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.key}><td>{r.key}</td><td className="num">{fr(r.n)}</td><td className="num">{r.visitors !== undefined ? fr(r.visitors) : ''}</td></tr>)}</tbody>
        </table>
      ) : <p className="sp-body-sm">{empty}</p>}
    </section>
  );
}
