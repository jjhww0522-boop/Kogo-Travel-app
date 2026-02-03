# KoGo – Seoul Travel Guide for Foreigners

Precision travel guide for foreigners in Korea with detailed station exit and bus stop info.

A precision travel guide service for foreign tourists visiting Korea. Built with Next.js, Tailwind CSS, and Naver Maps API.

## Features

- **Home Screen**: Weather, exchange rate, hero section, trending spots
- **Plan Input Form**: Flight number, travel period, pace, must-go places, must-eat foods
- **Emergency FAB**: Show current address in Korean to taxi drivers
- **Naver Map**: Seoul City Hall centered, extensible for path details
- **Tab Navigation**: Home, My Plans, Saved, Settings

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Map**: Naver Maps API
- **Database**: Supabase (planned)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Naver Maps API

1. Get a Client ID from [NAVER CLOUD PLATFORM](https://console.ncloud.com/) → **Application Services > Maps > Application**
2. **Application 수정**에서 **Dynamic Map(웹 동적 지도)** 이 선택되어 있는지 확인
3. **웹 서비스 URL 등록** (인증 실패 시 반드시 확인):
   - `http://localhost` , `http://127.0.0.1` (포트 없이)
   - 또는 `http://localhost:3000` , `http://127.0.0.1:3000` (접속 주소와 동일하게)
   - 저장 후 1–2분 뒤 **강력 새로고침**(Ctrl+Shift+R)
4. **인증 실패 시**: 코드는 **oapi.map.naver.com** + **ncpKeyId** (신버전) 사용 중. 콘솔 Client ID가 **0(숫자)** 인지 **o(영문)** 인지 확인 (예: qtc0k400x1 vs qtc0k4oox1)
5. Create `.env.local` with:

```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id
NAVER_MAP_CLIENT_SECRET=your_secret   # optional, for server-side API only
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
│   ├── Header.tsx
│   ├── HeroSection.tsx
│   ├── TrendingNow.tsx
│   ├── EmergencyFAB.tsx
│   ├── PlanInputModal.tsx
│   ├── NaverMap.tsx
│   ├── TabBar.tsx
│   └── PathDetailsAccordion.tsx  # For future route guides
└── types/
```

## Brand Colors

- **Modern Mint**: `#5eb3a6` (primary)
- **Soft Coral**: `#f4a89c` (accent)
