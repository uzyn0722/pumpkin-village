import { useEffect, useState } from 'react';
import { rpc } from '../supabase.js';
import { useLive } from '../live.js';

function getKey() { try { return localStorage.getItem('pv_admin') || ''; } catch { return ''; } }

export default function Admin() {
  const [key, setKey] = useState(getKey());
  const [input, setInput] = useState('');
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  const { peers, status } = useLive(null, null);

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    const load = () => rpc('admin_stats', { p_key: key })
      .then((d) => { if (alive) { setS(d); setErr(''); } })
      .catch(() => { if (alive) setErr('관리자 키가 맞지 않아요'); });
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [key]);

  if (!key || (err && !s)) {
    return (
      <main className="wrap page admin">
        <h1 className="admin-h">호박마을 관리자</h1>
        {err && <p className="error">{err}</p>}
        <form className="stack" onSubmit={(e) => { e.preventDefault(); try { localStorage.setItem('pv_admin', input.trim()); } catch { /* ignore */ } setErr(''); setKey(input.trim()); }}>
          <label className="field-label" htmlFor="ak">관리자 키</label>
          <input id="ak" className="input" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
          <button type="submit" className="btn-main">들어가기</button>
        </form>
      </main>
    );
  }

  const viewing = {};
  peers.forEach((p) => { const k = p.at || '마을'; viewing[k] = (viewing[k] || 0) + 1; });
  const hide = async (slug) => {
    if (!window.confirm(`${slug} 바구니를 숨길까요?`)) return;
    await rpc('admin_hide_basket', { p_key: key, p_slug: slug, p_hidden: true }).catch(() => {});
  };
  const max = s ? Math.max(1, ...s.hourly.map((h) => h.candies)) : 1;

  return (
    <main className="admin-wrap">
      <h1 className="admin-h">호박마을 관리자 <span className="muted">15초마다 새로고침</span></h1>
      {!s ? <p className="sub">불러오는 중…</p> : (
        <>
          <div className="kpis">
            <Kpi label="지금 접속" value={status === 'live' ? peers.length : '연결 안 됨'} note="실시간" />
            <Kpi label="오늘 방문자" value={s.visitors_today} note={`누적 ${s.visitors_total}`} />
            <Kpi label="만든 바구니" value={s.baskets_user} note={`오늘 ${s.baskets_user_today} · 공개 ${s.baskets_public}`} />
            <Kpi label="오간 쪽지" value={s.candies_user} note={`오늘 ${s.candies_user_today} · 익명 ${s.candies_anon_ratio ?? 0}%`} />
            <Kpi label="주민 사탕" value={s.candies_resident} note="운영 캐릭터" />
            <Kpi label="신고 / 삭제" value={`${s.reports} / ${s.removed}`} note="쪽지" />
          </div>

          <section className="admin-card">
            <h2>시간대별 쪽지 (최근 36시간)</h2>
            {s.hourly.length === 0 ? <p className="muted">아직 없어요</p> : (
              <div className="bars">
                {s.hourly.map((h) => (
                  <div key={h.h} className="bar-row">
                    <span className="bar-label">{h.h}</span>
                    <span className="bar" style={{ width: `${(h.candies / max) * 100}%` }} />
                    <span className="bar-n">{h.candies}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="admin-card">
            <h2>지금 어디에 있나</h2>
            <div className="tags">{Object.entries(viewing).sort((a, b) => b[1] - a[1]).map(([k, v]) => <span key={k} className="pill">{k} · {v}명</span>)}</div>
          </section>

          <section className="admin-card">
            <h2>사탕 많이 받은 바구니</h2>
            <table className="admin-table">
              <thead><tr><th>이름</th><th>링크</th><th>사탕</th><th></th></tr></thead>
              <tbody>
                {s.top_baskets.map((b) => (
                  <tr key={b.slug}><td>{b.owner_name}</td><td><a href={`/b/${b.slug}`} target="_blank" rel="noreferrer">/b/{b.slug}</a></td><td>{b.candies}</td><td><button type="button" className="btn-text danger" onClick={() => hide(b.slug)}>숨기기</button></td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="admin-card">
            <h2>신고된 쪽지</h2>
            {s.reported.length === 0 ? <p className="muted">신고 없음</p> : s.reported.map((r) => (
              <div key={r.id} className="report">
                <b>{r.owner_name}</b> ← {r.sender_name}: {r.message}
                <button type="button" className="btn-text danger" onClick={() => hide(r.slug)}>바구니 숨기기</button>
              </div>
            ))}
          </section>
          <button type="button" className="btn-text" onClick={() => { try { localStorage.removeItem('pv_admin'); } catch { /* ignore */ } setKey(''); setS(null); }}>로그아웃</button>
        </>
      )}
    </main>
  );
}

function Kpi({ label, value, note }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      <span className="kpi-note">{note}</span>
    </div>
  );
}
