import { Link } from 'react-router-dom';
import { Ghost } from '../art.jsx';
import { StickerTitle } from '../ui.jsx';

export default function NotFound() {
  return (
    <main className="wrap page center">
      <Ghost v={3} size={110} />
      <StickerTitle size={30}>여기엔 바구니가 없어요</StickerTitle>
      <p className="sub">링크가 잘못됐거나, 사라진 바구니예요</p>
      <Link to="/" className="btn-main">마을로 가기</Link>
    </main>
  );
}
