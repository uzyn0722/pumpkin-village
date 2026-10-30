import { useState } from 'react';
import { pushState, enablePush } from './push.js';
import { StickerTitle } from './ui.jsx';

export default function AlertButton({ slug, ownerKey }) {
  const [state, setState] = useState(() => pushState());
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);

  const click = async () => {
    if (state === 'ios-home') { setGuide(true); return; }
    if (state !== 'off') return;
    setBusy(true);
    try { setState(await enablePush(slug, ownerKey)); } catch { setState('off'); } finally { setBusy(false); }
  };

  const label = {
    on: '🔔 사탕 알림 켜짐',
    off: busy ? '알림 켜는 중…' : '🔔 사탕 오면 알림 받기',
    denied: '알림이 차단돼 있어요 (설정에서 허용)',
    'ios-home': '🔔 사탕 오면 알림 받기',
    unsupported: '이 브라우저는 알림을 지원하지 않아요',
  }[state];

  return (
    <>
      <button type="button" className={`btn-alert ${state === 'on' ? 'on' : ''}`} onClick={click} disabled={busy || state === 'on' || state === 'unsupported' || state === 'denied'}>
        {label}
      </button>
      {guide && (
        <div className="sheet-back" role="dialog" aria-modal="true" aria-label="아이폰 알림 설정" onClick={() => setGuide(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <StickerTitle size={24} as="h2">아이폰은 홈 화면에 추가해야 알림이 와요</StickerTitle>
            <ol className="steps light">
              <li><span className="step-n">1</span><span>아래 버튼으로 알림용 페이지를 열어요</span></li>
              <li><span className="step-n">2</span><span>사파리 아래 공유 버튼 → <b>홈 화면에 추가</b></span></li>
              <li><span className="step-n">3</span><span>홈 화면의 호박마을 아이콘으로 열고 <b>알림 받기</b>를 눌러요</span></li>
            </ol>
            <a className="btn-main" href={`/b/${slug}?k=${ownerKey}&pwa=1`}>알림용 페이지 열기</a>
            <p className="hint center">이 페이지 주소엔 관리 링크가 들어 있어요. 다른 사람한테 보내지 마세요</p>
            <button type="button" className="btn-text" onClick={() => setGuide(false)}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
}
