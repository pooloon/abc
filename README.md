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
| **GitHub Pages** | https://pooloon.github.io/vibeCD/investment/ | UI만 (시세 API는 CORS 제한) |
| **Vercel** | `vercel.json` rewrites 연동 시 전체 기능 | ✅ |
| **Netlify** | `netlify.toml` redirects 연동 시 전체 기능 | ✅ |

## GitHub Pages 배포

`20260705-investment-planner` 브랜치에 push하면 Actions가 자동 배포합니다.

1. 저장소 **Settings → Pages → Build and deployment** → Source: **GitHub Actions**
2. 브랜치 push 후 Actions 탭에서 `Deploy Investment Planner to GitHub Pages` 확인

수동 빌드:

```bash
BASE_PATH=/vibeCD/investment/ npm run build
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
