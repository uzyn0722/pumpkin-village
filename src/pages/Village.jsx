import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rpc } from '../supabase.js';
import { Pumpkin, Ghost, Rainbow, Flower } from '../art.jsx';
import { StickerTitle, Toasts, NameTag, EmojiBar, EMOJIS, HowButton } from '../ui.jsx';
import { useLive, useActs, useToasts, sendAct } from '../live.js';
import { deviceId, ownedKeys, neighbors, useServerClock, fmtLeft, openLabel, hashNum } from '../lib.js';

export default function Village({ me, openPicker, openHow }) {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const { peers, status } = useLive(me, null);
  const [toasts, pushToast] = useToasts();
  const [floats, setFloats] = useState({});
  const myKey = deviceId();
  const owned = ownedKeys();
  const mySlugs = Object.keys(owned);
  const near = neighbors();

  useEffect(() => {
    let alive = true;
    const load = () => {
      rpc('list_village', { p_limit: 80 }).then((d) => alive && setList(d || [])).catch(() => {});
      rpc('village_stats').then((d) => alive && setStats(d)).catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const now = useServerClock(stats && stats.now);
  const openAt = stats ? new Date(stats.open_at).getTime() : null;
  const opened = openAt && now >= openAt;

  const viewers = useMemo(() => {
    const m = {};
    peers.forEach((p) => { if (p.at) m[p.at] = (m[p.at] || 0) + 1; });
    return m;
  }, [peers]);

  const houses = useMemo(() => [...list].sort((a, b) => (viewers[b.slug] || 0) - (viewers[a.slug] || 0)), [list, viewers]);
  const here = peers.filter((p) => !p.at);

  useActs((p) => {
    if (p.kind === 'react' && !p.at) {
      const id = Math.random();
      setFloats((f) => ({ ...f, [p.key]: { id, emoji: p.emoji } }));
      setTimeout(() => setFloats((f) => (f[p.key] && f[p.key].id === id ? { ...f, [p.key]: null } : f)), 1600);
      if (!p.self) pushToast(`${p.nick}님이 ${p.text}`);
    }
    if (p.kind === 'candy' && !p.self) {
      pushToast(p.name ? `누군가 방금 ${p.name}네 바구니에 사탕을 넣었어요` : '누군가 방금 사탕을 넣었어요');
      setStats((s) => (s ? { ...s, candies_total: (s.candies_total || 0) + 1 } : s));
    }
  });

  const react = (x) => sendAct({ kind: 'react', emoji: x.e, text: x.text });
  const BASE_ONLINE = 92;
  const online = Math.max(status === 'live' ? peers.length : 0, BASE_ONLINE);

  return (
    <main className="village">
      <Toasts toasts={toasts} />
      <header className="v-head wrap">
        <div className="logo">
          <span className="logo-en">Halloween</span>
          <StickerTitle size={40}>호박마을</StickerTitle>
        </div>
        <span className="pill live-pill"><span className="dot" />{online}명 마을에 있어요</span>
      </header>

      <section className="wrap">
        <div className="counter-card">
          <div className="cc-col">
            <span className="cc-label">마을에 담긴 사탕</span>
            <span className="cc-num">{stats ? Number(stats.candies_total).toLocaleString() : '…'}<small> 개</small></span>
          </div>
          <div className="cc-col right">
            <span className="cc-label">{opened ? '모든 바구니가' : '다 같이 여는 시간까지'}</span>
            <span className="cc-time">{opened ? '열렸어요!' : openAt ? fmtLeft(openAt - now) : '…'}</span>
          </div>
        </div>
        <p className="key-msg center">🍬 사탕 하나 = 친구가 보낸 <b>비밀 쪽지</b><br />할로윈이 끝나는 <b>{stats ? openLabel(stats.open_at) : '11월 1일 0시'}</b>, 다 같이 열어봐요</p>
        <div className="center"><HowButton onClick={openHow} /></div>

        {(mySlugs.length > 0 || near.length > 0) && (
          <div className="chips" aria-label="내 바구니와 이웃">
            <span className="chips-label">내 이웃</span>
            {mySlugs.map((s) => <Link key={s} className="chip mine" to={`/b/${s}`}>내 바구니</Link>)}
            {near.slice(0, 8).map((n) => <Link key={n.slug} className="chip" to={`/b/${n.slug}`}>{n.name}네</Link>)}
          </div>
        )}
      </section>

      <section className="map">
        <div className="map-ghosts" aria-hidden={here.length === 0}>
          {here.slice(0, 14).map((p, i) => {
            const x = p.key === myKey ? 50 : 6 + hashNum(p.key, 86);
            const y = p.key === myKey ? 6 : 4 + hashNum(p.key + 'y', 80);
            const f = floats[p.key];
            return (
              <div key={p.key} className="map-ghost" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 6) * 0.35}s` }}>
                {f && <span key={f.id} className="float-emoji">{f.emoji}</span>}
                <button type="button" className="ghost-btn" onClick={p.key === myKey ? openPicker : undefined} aria-label={p.key === myKey ? '내 유령 바꾸기' : p.nick}>
                  <Ghost v={p.ghost || 1} size={p.key === myKey ? 50 : 40} />
                </button>
                <NameTag name={p.nick} me={p.key === myKey} />
              </div>
            );
          })}
        </div>
        <div className="houses">
          {houses.map((h) => {
            const v = viewers[h.slug] || 0;
            return (
              <Link key={h.slug} to={`/b/${h.slug}`} className="house">
                <span className={`house-viewers ${v ? '' : 'empty'}`}>{v ? `${v}명 구경 중` : ' '}</span>
                <span className="house-pk">
                  <Pumpkin v={h.style} size={112} />
                  {h.is_official && <span className="badge house-badge">주민</span>}
                </span>
                <span className="house-name"><span className="nowrap">{h.owner_name}{h.is_official ? '' : '네'}</span></span>
                <span className="house-count">🍬 {h.candy_count}</span>
              </Link>
            );
          })}
        </div>
        <Rainbow width={600} height={240} className="map-rainbow" />
        <Flower size={44} className="map-flower" />
      </section>

      <div className="bottom-bar">
        <div className="wrap">
          <EmojiBar onSend={react} />
          {mySlugs.length > 0 ? (
            <button type="button" className="btn-main" onClick={() => nav(`/b/${mySlugs[0]}`)}>내 바구니 보러 가기</button>
          ) : (
            <button type="button" className="btn-main" onClick={() => nav('/new')}>내 사탕 바구니 만들기</button>
          )}
        </div>
      </div>
    </main>
  );
}

export { EMOJIS };
