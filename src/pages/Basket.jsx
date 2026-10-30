import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { rpc } from '../supabase.js';
import { BasketArt, Candy, Rainbow } from '../art.jsx';
import { StickerTitle, Toasts, GhostCrowd, EmojiBar, LivePill } from '../ui.jsx';
import { useLive, useActs, useToasts, sendAct } from '../live.js';
import { deviceId, ownerKey, saveOwned, useServerClock, fmtLeft, openLabel, errMsg, CANDY_NAMES } from '../lib.js';
import { makeStory, shareOrDownload } from '../story.js';
import NotFound from './NotFound.jsx';
import AlertButton from '../AlertButton.jsx';

export default function Basket({ me }) {
  const { slug } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const [b, setB] = useState(undefined);
  const [isOwner, setOwner] = useState(false);
  const { peers, status } = useLive(me, slug);
  const [toasts, pushToast] = useToasts();
  const [floats, setFloats] = useState({});
  const myKey = deviceId();

  useEffect(() => {
    const k = new URLSearchParams(loc.search).get('k');
    let alive = true;
    (async () => {
      try {
        const basket = await rpc('get_basket', { p_slug: slug });
        if (!alive) return;
        setB(basket || null);
        const key = k || ownerKey(slug);
        if (basket && key) {
          const ok = await rpc('verify_owner', { p_slug: slug, p_key: key });
          if (ok) { saveOwned(slug, key, basket.owner_name); if (alive) setOwner(true); }
        }
        if (k && !new URLSearchParams(loc.search).get('pwa')) nav(`/b/${slug}`, { replace: true });
      } catch { if (alive) setB(null); }
    })();
    return () => { alive = false; };
  }, [slug]);

  const now = useServerClock(b && b.now);
  const openAt = b ? new Date(b.open_at).getTime() : 0;
  const opened = b && now >= openAt;
  const here = peers.filter((p) => p.at === slug);
  const crowd = status === 'live' ? here : [{ key: myKey, nick: me.nick, ghost: me.ghost }];

  useActs((p) => {
    if (p.at !== slug) return;
    if (p.kind === 'react') {
      const id = Math.random();
      setFloats((f) => ({ ...f, [p.key]: { id, emoji: p.emoji } }));
      setTimeout(() => setFloats((f) => (f[p.key] && f[p.key].id === id ? { ...f, [p.key]: null } : f)), 1600);
      if (!p.self) pushToast(`${p.nick}님이 ${p.text}`);
    }
    if (p.kind === 'candy' && !p.self) {
      pushToast('누군가 방금 사탕을 넣었어요 🍬');
      setB((x) => (x ? { ...x, candy_count: x.candy_count + 1 } : x));
    }
  });

  if (b === undefined) return <main className="wrap page"><p className="sub center">바구니 불러오는 중…</p></main>;
  if (b === null) return <NotFound />;

  if (isOwner && opened) return <OpenView b={b} slug={slug} />;

  const togglePublic = async () => {
    try { await rpc('set_public', { p_slug: slug, p_key: ownerKey(slug), p_public: !b.is_public }); setB({ ...b, is_public: !b.is_public }); } catch (e) { pushToast(errMsg(e)); }
  };

  return (
    <main className="basket">
      <Toasts toasts={toasts} />
      <div className="wrap top-row">
        <Link to="/" className="pill back">← 마을로</Link>
        {status === 'live' && <LivePill count={here.length} />}
      </div>
      <div className="wrap center">
        <StickerTitle size={32}>{b.owner_name}의 사탕 바구니</StickerTitle>
        <p className="sub">{opened ? '바구니가 열렸어요!' : `${openLabel(b.open_at)}에 열려요 · ${fmtLeft(openAt - now)} 남음`}</p>
        {b.is_official && <span className="badge big">호박마을 주민</span>}
        {isOwner && !opened && <div className="alert-slot"><AlertButton slug={slug} ownerKey={ownerKey(slug)} /></div>}
      </div>

      <section className="stage">
        <Rainbow width={520} height={260} className="stage-rainbow" />
        <div className="stage-basket"><BasketArt style={b.style} count={b.candy_count} size={230} /></div>
        <div className="stage-count"><span className="count-chip">🔒 사탕 {b.candy_count}개</span></div>
        <GhostCrowd peers={crowd} myKey={myKey} floats={floats} />
      </section>

      <div className="bottom-bar">
        <div className="wrap">
          <EmojiBar onSend={(x) => sendAct({ kind: 'react', emoji: x.e, text: x.text })} />
          {isOwner ? (
            <>
              <button type="button" className="btn-main" onClick={() => nav(`/b/${slug}/share`)}>친구들한테 링크 보내기</button>
              <div className="owner-row">
                <span className="hint">쪽지는 {openLabel(b.open_at)}에 나만 열 수 있어요</span>
                <button type="button" className="btn-text" onClick={togglePublic}>{b.is_public ? '마을에서 내리기' : '마을에 올리기'}</button>
              </div>
            </>
          ) : opened ? (
            <>
              <button type="button" className="btn-main" disabled>이미 열린 바구니예요</button>
              <Link className="btn-text center" to="/new">나도 바구니 만들기</Link>
            </>
          ) : (
            <>
              <button type="button" className="btn-main" onClick={() => nav(`/b/${slug}/write`)}>사탕 넣어주기</button>
              <p className="hint center">쪽지는 바구니 주인만 열어볼 수 있어요</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function OpenView({ b, slug }) {
  const [candies, setCandies] = useState(null);
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState('');
  const [making, setMaking] = useState(false);

  useEffect(() => {
    rpc('get_candies', { p_slug: slug, p_key: ownerKey(slug) }).then((d) => setCandies(d || [])).catch((e) => setErr(errMsg(e)));
  }, [slug]);

  const remove = async (c, report) => {
    if (!window.confirm(report ? '이 쪽지를 신고하고 지울까요?' : '이 쪽지를 지울까요?')) return;
    try {
      await rpc('remove_candy', { p_slug: slug, p_key: ownerKey(slug), p_id: c.id, p_report: report });
      setCandies((list) => list.filter((x) => x.id !== c.id)); setSel(null);
    } catch (e) { setErr(errMsg(e)); }
  };
  const share = async () => {
    setMaking(true);
    try {
      const blob = await makeStory({ kind: 'result', name: b.owner_name, count: candies ? candies.length : 0, style: b.style, url: `${window.location.origin}` });
      await shareOrDownload(blob, `pumpkin-result-${slug}.png`);
    } finally { setMaking(false); }
  };
  const idx = sel ? candies.findIndex((c) => c.id === sel.id) : -1;

  return (
    <main className="wrap page">
      <div className="top-row"><Link to="/" className="pill back">← 마을로</Link></div>
      <div className="center">
        <StickerTitle size={32}>바구니가 열렸어요!</StickerTitle>
        <p className="sub">{candies ? `사탕 ${candies.length}개를 받았어요. 하나씩 눌러서 열어보세요` : '사탕 꺼내는 중…'}</p>
      </div>
      {err && <p className="error">{err}</p>}
      <div className="candy-grid">
        {(candies || []).map((c, i) => (
          <button key={c.id} type="button" className="candy-cell" style={{ animationDelay: `${Math.min(i, 30) * 0.05}s` }} onClick={() => setSel(c)} aria-label={`${c.sender_name}의 ${CANDY_NAMES[c.candy_type]} 사탕 열기`}>
            <Candy t={c.candy_type} size={72} />
            <span className="candy-from nowrap">{c.sender_name}</span>
          </button>
        ))}
      </div>
      {candies && candies.length === 0 && <p className="sub center">이번엔 사탕이 없어요. 다음 이벤트 때 다시 해봐요!</p>}
      {candies && candies.length > 0 && (
        <button type="button" className="btn-main" onClick={share} disabled={making}>{making ? '만드는 중…' : '결과 스토리로 자랑하기'}</button>
      )}
      {sel && (
        <div className="sheet-back" role="dialog" aria-modal="true" aria-label="쪽지" onClick={() => setSel(null)}>
          <div className="sheet note" onClick={(e) => e.stopPropagation()}>
            <Candy t={sel.candy_type} size={80} />
            <span className="note-from">{sel.is_anonymous ? `익명 · ${sel.sender_name}` : sel.sender_name}</span>
            <p className="note-text">{sel.message}</p>
            <div className="btn-row">
              <button type="button" className="btn-sub" disabled={idx <= 0} onClick={() => setSel(candies[idx - 1])}>이전</button>
              <button type="button" className="btn-sub" disabled={idx >= candies.length - 1} onClick={() => setSel(candies[idx + 1])}>다음</button>
            </div>
            <div className="btn-row">
              <button type="button" className="btn-text" onClick={() => remove(sel, false)}>지우기</button>
              <button type="button" className="btn-text danger" onClick={() => remove(sel, true)}>신고하기</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
