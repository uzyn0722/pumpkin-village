import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { BasketArt, Candy, Ghost, Rainbow } from '../art.jsx';
import { StickerTitle } from '../ui.jsx';
import { ownedKeys } from '../lib.js';

export default function Done({ me }) {
  const { slug } = useParams();
  const nav = useNavigate();
  const st = useLocation().state || {};
  const mine = Object.keys(ownedKeys());

  return (
    <main className="wrap page done">
      <Rainbow width={480} height={230} className="done-rainbow" />
      <StickerTitle size={84} className="center">쏙!</StickerTitle>
      <div className="done-art">
        <span className="done-candy"><Candy t={st.type || 3} size={64} /></span>
        <BasketArt style={1} count={st.count || 1} size={200} />
        <span className="done-ghost"><Ghost v={me.ghost} size={60} /></span>
      </div>
      <div className="center stack-tight">
        <h2 className="done-title">{st.name ? `${st.name}의 바구니에` : '바구니에'}<br />사탕을 넣었어요</h2>
        <p className="sub">자정에 바구니 주인이 열어볼 거예요</p>
        {st.count ? <span className="count-chip">지금까지 받은 사탕 <b>{st.count}개</b></span> : null}
      </div>
      <div className="stack">
        <p className="center strong">나도 친구들한테 사탕 받아볼까?</p>
        {mine.length ? (
          <button type="button" className="btn-main" onClick={() => nav(`/b/${mine[0]}`)}>내 바구니 보러 가기</button>
        ) : (
          <button type="button" className="btn-main" onClick={() => nav('/new')}>나도 바구니 만들기</button>
        )}
        <Link to="/" className="btn-sub wide center">마을 구경하러 가기</Link>
        <Link to={`/b/${slug}`} className="btn-text center">바구니로 돌아가기</Link>
      </div>
    </main>
  );
}
