import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rpc } from '../supabase.js';
import { Pumpkin } from '../art.jsx';
import { StickerTitle } from '../ui.jsx';
import { saveOwned, errMsg, getRef, deviceId, ownedKeys } from '../lib.js';

const STYLES = [
  { v: 1, label: '하트눈' }, { v: 2, label: '별눈' }, { v: 3, label: '클래식' }, { v: 4, label: '선글라스' },
];

export default function Create() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [style, setStyle] = useState(1);
  const [isPublic, setPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await rpc('create_basket', { p_name: name.trim(), p_style: style, p_public: isPublic, p_ref: ownedKeys()[getRef()] ? null : getRef(), p_device: deviceId() });
      saveOwned(r.slug, r.admin_key, name.trim());
      nav(`/b/${r.slug}/share`, { replace: true, state: { fresh: true } });
    } catch (ex) { setErr(errMsg(ex)); setBusy(false); }
  };

  return (
    <main className="wrap page">
      <div className="top-row">
        <Link to="/" className="pill back">← 마을로</Link>
      </div>
      <StickerTitle size={32}>내 사탕 바구니 만들기</StickerTitle>
      <p className="sub">링크를 친구들한테 보내면 쪽지 사탕이 차곡차곡 쌓여요</p>
      <form onSubmit={submit} className="stack">
        <div className="card">
          <label className="field-label" htmlFor="bname">바구니에 보일 이름</label>
          <input id="bname" className="input" maxLength={12} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름이나 별명 (12자까지)" autoComplete="off" />
          <p className="hint">“{name.trim() || '○○'}의 사탕 바구니”로 보여요. 별명도 좋아요</p>
        </div>
        <div className="card">
          <span className="field-label">바구니 호박 고르기</span>
          <div className="style-grid">
            {STYLES.map((s) => (
              <button key={s.v} type="button" className={`pick ${style === s.v ? 'on' : ''}`} onClick={() => setStyle(s.v)} aria-pressed={style === s.v}>
                <Pumpkin v={s.v} size={74} />
                <span className="pick-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="toggle-row card">
          <span>
            <span className="field-label">마을에 내 바구니 보여주기</span>
            <span className="hint">끄면 링크를 받은 사람만 들어올 수 있어요</span>
          </span>
          <input type="checkbox" className="switch" checked={isPublic} onChange={(e) => setPublic(e.target.checked)} />
        </label>
        {err && <p className="error">{err}</p>}
        <button type="submit" className="btn-main" disabled={!name.trim() || busy}>{busy ? '만드는 중…' : '바구니 만들기'}</button>
      </form>
    </main>
  );
}
