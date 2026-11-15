import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useData } from '../context/DataContext.jsx';
import { Card, Bar, Loading } from '../components/ui.jsx';

export default function Reports() {
  const { toast } = useData();
  const [data, setData] = useState(null);
  useEffect(() => { api.reports().then(setData).catch(() => setData({ kpis: [], weeks: [], targets: [] })); }, []);
  if (!data) return <Loading />;

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value', 'Note'],
      ...data.kpis.map((k) => [k.label, k.value, k.note]),
      [],
      ['Week', 'Manual (min)', 'With Casewise (min)'],
      ...data.weeks.map((w) => [w.week, w.manual, w.assisted]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'casewise-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Report downloaded as CSV');
  };

  return (
    <>
      <div className="ph">
        <div>
          <h1>Impact & performance</h1>
          <p className="sub">Measured outcomes against documented baselines.</p>
        </div>
        <button className="btn" onClick={exportCsv}>Export report</button>
      </div>

      <div className="grid g4">
        {data.kpis.map((k) => (
          <Card key={k.label} className="stat">
            <div className="sl">{k.label}</div>
            <div className="sv">{k.value}</div>
            <div className="sm">{k.note}</div>
          </Card>
        ))}
      </div>

      <div className="two" style={{ marginTop: 20, gridTemplateColumns: '1.6fr 1fr' }}>
        <Card style={{ padding: 20 }}>
          <h3>Time to find evidence</h3>
          <div className="sm" style={{ marginTop: 4 }}>Median minutes per query, by week</div>
          <div className="chart">
            {data.weeks.map((w) => (
              <div key={w.week} className="wc">
                <div className="pair">
                  <i className="pm" style={{ height: w.manual * 2.4 }} title={`Manual: ${w.manual} min`} />
                  <i className="pa" style={{ height: w.assisted * 2.4 }} title={`With Casewise: ${w.assisted} min`} />
                </div>
                <span className="sm">{w.week}</span>
              </div>
            ))}
          </div>
          <div className="legend">
            <span><i className="pm" />Manual search</span>
            <span><i className="pa" />With Casewise</span>
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <h3>Quality targets</h3>
          <div style={{ marginTop: 8 }}>
            {data.targets.map((t) => (
              <div key={t.label} className="tgt">
                <div className="hd"><span>{t.label}</span><b>{t.value}%</b></div>
                <Bar value={t.value} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
