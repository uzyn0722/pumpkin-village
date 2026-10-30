# 할로윈 호박마을 🎃

링크를 공유하면 친구들이 쪽지 사탕을 넣어주고, 11월 1일 0시에 마을의 모든 바구니가 한꺼번에 열리는 웹 서비스.

- 프론트: Vite + React (모바일 우선, PC 대응)
- 백엔드: Supabase (DB 함수 + Realtime 접속 표시)
- 배포: Vercel (Framework: Vite, 빌드 `npm run build`, 출력 `dist`)

## 화면
- `/` 마을 · `/new` 바구니 만들기 · `/b/:slug` 바구니 · `/b/:slug/write` 사탕 넣기 · `/b/:slug/done` 완료 · `/b/:slug/share` 공유(주인)
- `/admin` 관리자 대시보드 (관리자 키 필요)

## 환경 변수 (선택)
코드에 공개용 키가 기본값으로 들어 있어요. 바꾸려면 Vercel에 아래 값을 넣으세요.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY` (publishable key)
