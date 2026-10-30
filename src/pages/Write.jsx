import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rpc } from '../supabase.js';
import { Candy } from '../art.jsx';
import { StickerTitle } from '../ui.jsx';
import { sendAct, useLive } from '../live.js';
import { addNeighbor, errMsg, CANDY_NAMES } from '../lib.js';

export default function Write({ me }) {
  const { slug } = useParams();
  const nav = useNavigate();
  useLive(me, slug);
  const [b, setB] = useState(null);
  const [type, setType] = useState(1);
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState('nick');
  const [nick, setNick] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { rpc('get_basket', { p_slug: slug }).then(setB).catch(() => {}); }, [slug]);

  const sender = mode === 'anon' ? me.nick : nick.trim();
  const ok = msg.trim().length > 0 && sender.length > 0 && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true); setErr('');
    try {
      const r = await rpc('add_candy', { p_slug: slug, p_type: type, p_message: msg.trim(), p_sender: sender.slice(0, 12), p_anon: mode === 'anon' });
      if (b) addNeighbor(slug, b.owner_name);
      sendAct({ kind: 'candy', name: b ? b.owner_name : '' });
      nav(`/b/${slug}/done`, { replace: true, state: { count: r.candy_count, name: b ? b.owner_name : '', type } });
    } catch (ex) { setErr(errMsg(ex)); setBusy(false); }
  };

  return (
    <main className="wrap page">
      <div className="top-row">
        <Link to={`/b/${slug}`} className="pill back">← 바구니로</Link>
        <span className="muted nowrap">{b ? `${b.owner_name}의 사탕 바구니` : ''}</span>
      </div>
      <StickerTitle size={30}>어떤 사탕을 넣어줄까요?</StickerTitle>
      <form className="stack" onSubmit={submit}>
        <div className="candy-pick">
          {[1, 2, 3, 4].map((t) => (
            <button key={t} type="button" className={`pick ${type === t ? 'on' : ''}`} onClick={() => setType(t)} aria-pressed={type === t}>
              <Candy t={t} size={58} />
              <span className="pick-label">{t === 3 ? '고백 하트' : CANDY_NAMES[t]}</span>
            </button>
          ))}
        </div>
        <div className="card note-card">
          <label className="field-label" htmlFor="msg">쪽지</label>
          <textarea id="msg" className="textarea" rows={5} maxLength={200} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={b ? `${b.owner_name}에게 하고 싶은 말을 적어주세요` : '하고 싶은 말을 적어주세요'} />
          <span className="hint right">{msg.length} / 200</span>
        </div>
        <div className="stack-tight">
          <span className="field-label">어떻게 전할까요?</span>
          <div className="seg">
            <button type="button" className={mode === 'nick' ? 'on' : ''} onClick={() => setMode('nick')}>닉네임으로</button>
            <button type="button" className={mode === 'anon' ? 'on' : ''} onClick={() => setMode('anon')}>익명 유령으로</button>
          </div>
          {mode === 'nick' ? (
            <>
              <label className="sr-only" htmlFor="nick">닉네임</label>
              <input id="nick" className="input" maxLength={12} value={nick} onChange={(e) => setNick(e.target.value)} placeholder="보내는 사람 (예: 같은 반 민지)" autoComplete="off" />
            </>
          ) : (
            <p className="anon-note">‘{me.nick}’ 이름으로 전해져요. 누가 보냈는지는 아무도 몰라요 👻</p>
          )}
          {type === 3 && <p className="hint">💌 고백도 익명으로 할 수 있어요. 자정에 바구니가 열릴 때 전해져요</p>}
        </div>
        {err && <p className="error">{err}</p>}
        <button type="submit" className="btn-main" disabled={!ok}>{busy ? '넣는 중…' : '바구니에 쏙 넣기'}</button>
      </form>
    </main>
  );
}
