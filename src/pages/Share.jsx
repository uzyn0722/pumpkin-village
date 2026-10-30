import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { rpc } from '../supabase.js';
import { BasketArt } from '../art.jsx';
import { StickerTitle } from '../ui.jsx';
import { ownerKey, openLabel } from '../lib.js';
import { makeStory, shareOrDownload } from '../story.js';

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    t.remove(); return ok;
  }
}

export default function Share() {
  const { slug } = useParams();
  const key = ownerKey(slug);
  const [b, setB] = useState(null);
  const [copied, setCopied] = useState('');
  const [making, setMaking] = useState(false);
  const origin = window.location.origin;
  const link = `${origin}/b/${slug}`;
  const manage = `${origin}/b/${slug}?k=${key}`;

  useEffect(() => { rpc('get_basket', { p_slug: slug }).then(setB).catch(() => {}); }, [slug]);
  if (!key) return <Navigate to={`/b/${slug}`} replace />;

  const doCopy = async (what, text) => { if (await copy(text)) { setCopied(what); setTimeout(() => setCopied(''), 1800); } };
  const doShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: '할로윈 호박마을', text: `${b ? b.owner_name : ''}의 바구니에 사탕 넣어줘! 🎃`, url: link }); return; } catch { return; } }
    doCopy('link', link);
  };
  const doStory = async () => {
    if (!b) return; setMaking(true);
    try {
      const blob = await makeStory({ kind: 'invite', name: b.owner_name, count: b.candy_count, style: b.style, openText: openLabel(b.open_at), url: link });
      await shareOrDownload(blob, `pumpkin-${slug}.png`);
    } finally { setMaking(false); }
  };

  return (
    <main className="wrap page">
      <div className="top-row">
        <Link to={`/b/${slug}`} className="pill back">← 내 바구니</Link>
      </div>
      <StickerTitle size={32}>바구니 완성!</StickerTitle>
      <p className="sub">링크를 뿌리면 친구들이 사탕을 넣어줘요</p>
      <div className="center-art"><BasketArt style={b ? b.style : 1} count={b ? b.candy_count : 0} size={180} /></div>

      <div className="stack">
        <div className="card">
          <span className="field-label">내 바구니 링크</span>
          <div className="link-box"><span className="link-text">{link.replace(/^https?:\/\//, '')}</span></div>
          <div className="btn-row">
            <button type="button" className="btn-main" onClick={doShare}>링크 보내기</button>
            <button type="button" className="btn-sub" onClick={() => doCopy('link', link)}>{copied === 'link' ? '복사됨!' : '복사'}</button>
          </div>
        </div>

        <div className="card">
          <span className="field-label">인스타 스토리에 올리기</span>
          <ol className="steps">
            <li><span className="step-n">1</span><span>아래 버튼으로 스토리 이미지 저장</span></li>
            <li><span className="step-n">2</span><span>스토리에 이미지 올리기</span></li>
            <li><span className="step-n">3</span><span>링크 스티커에 내 바구니 링크 붙이기</span></li>
          </ol>
          <button type="button" className="btn-sub wide" onClick={doStory} disabled={making || !b}>{making ? '만드는 중…' : '스토리 이미지 저장'}</button>
        </div>

        <div className="card warn">
          <span className="field-label">⚠️ 관리 링크는 꼭 저장해두세요</span>
          <p className="hint">로그인이 없어서, 다른 폰이나 브라우저에서는 이 링크로만 내 바구니를 열 수 있어요. 친구한테는 보내지 마세요!</p>
          <button type="button" className="btn-sub wide" onClick={() => doCopy('manage', manage)}>{copied === 'manage' ? '복사됐어요! 메모에 붙여두세요' : '관리 링크 복사'}</button>
        </div>
        <Link to="/" className="btn-text center">마을 구경하러 가기</Link>
      </div>
    </main>
  );
}
