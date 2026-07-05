# Nationality Engine — Investment Planner

React + Vite 기반 통합 투자·순차전략 설계 웹앱.

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:5173/

## 배포 URL

| 플랫폼 | URL | API 프록시 |
|--------|-----|------------|
| **GitHub Pages** | https://pooloon.github.io/abc/ | UI만 (시세 API는 CORS 제한) |
| **Vercel** | `vercel.json` rewrites 연동 시 전체 기능 | ✅ |
| **Netlify** | `netlify.toml` redirects 연동 시 전체 기능 | ✅ |

## GitHub Pages 배포

`main` 브랜치 push → Actions가 빌드 후 `gh-pages` 브랜치에 배포합니다.

**Settings → Pages → Build and deployment (필수):**

| 항목 | 올바른 설정 | 잘못된 설정 (빈 화면) |
|------|-------------|----------------------|
| Source | **Deploy from a branch** | Deploy from a branch |
| Branch | **`gh-pages`** / `/ (root)` | **`main`** / root |

`main` 브랜치를 Pages 소스로 두면 소스 코드(`/src/main.tsx`)만 올라가 **화면이 비어 보입니다.**

배포 URL: **https://pooloon.github.io/abc/**

수동 빌드:

```bash
BASE_PATH=/abc/ npm run build
```

## 환경 변수

`.env` 파일에 Open DART API 키 설정 (재무·설정 탭 또는 `.env.example` 참고):

```
VITE_DART_API_KEY=your_key
```

## Vercel 원클릭 배포

```bash
npx vercel --prod
```

`vercel.json`에 Yahoo / DART / KRX API 프록시가 포함되어 있습니다.
