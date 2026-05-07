# Supabase + Vercel 배포 가이드

## 개요

현재 프로젝트는 아래 방식으로 동작합니다.

- `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 설정되어 있으면 `Supabase`를 사용
- 환경변수가 없으면 로컬 개발용 `data/rooms.json` 파일 저장소를 사용

즉, 로컬에서는 그대로 개발하고, 배포 환경에서는 Supabase를 연결해 외부 사용자도 사용할 수 있게 만든 구조입니다.

## 1. Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 생성합니다.
2. 프로젝트가 준비되면 `Project URL`과 `service_role key`를 확인합니다.
3. SQL Editor를 열고 [supabase/schema.sql](./supabase/schema.sql) 내용을 실행합니다.

주의:
- 기존에 이미 `rooms`, `participants` 테이블을 만든 상태여도 다시 실행해도 됩니다.
- 이번 스키마에는 `expires_at` 컬럼 추가와 만료 방 자동 삭제 cron job 생성이 포함되어 있습니다.
- `cron.schedule(...)`를 쓰려면 Supabase에서 `pg_cron`이 활성화되어 있어야 합니다.

필요한 환경변수:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2. 로컬에서 Supabase 연결 테스트

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 넣습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

그 다음 실행:

```bash
npm install
npm run dev
```

이 상태에서 방 생성 후 Supabase 테이블 `rooms`, `participants`에 데이터가 들어가는지 확인합니다.

## 3. Vercel 배포

### 방법 A: GitHub 연결 배포

1. 이 프로젝트를 GitHub 저장소로 올립니다.
2. Vercel Dashboard에서 `New Project`를 누릅니다.
3. GitHub 저장소를 선택해 import 합니다.
4. Framework는 `Next.js`로 자동 인식됩니다.
5. Project Settings > Environment Variables 에서 아래 두 값을 추가합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

6. Deploy를 실행합니다.

### 방법 B: Vercel CLI 배포

```bash
npm i -g vercel
vercel
```

프로젝트 연결 후 Vercel Dashboard 또는 CLI로 환경변수를 추가하고, 마지막으로 운영 배포를 실행합니다.

```bash
vercel --prod
```

## 4. 배포 후 확인할 것

1. 첫 화면 접속 확인
2. 방 생성 확인
3. 결과 화면에서 공유 링크 복사 확인
4. 공유 링크(`/join?code=123456`) 접속 시 초대코드 자동 입력 확인
5. Supabase에 데이터 저장 확인
6. `rooms.expires_at` 값이 생성 시점 기준 7일 뒤로 들어가는지 확인

## 5. 운영 시 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 코드에 노출하면 안 됩니다.
- 현재 구조에서는 서버 코드에서만 이 키를 사용합니다.
- 환경변수를 바꾼 뒤에는 Vercel에서 반드시 재배포해야 반영됩니다.
- 현재는 로그인 없는 서비스라 누구나 초대코드만 알면 참여 가능합니다.
- 만료된 방은 조회/참여 시 앱에서 차단되고, DB에서는 cron job이 정리합니다.

## 6. 직접 배포를 제가 대신하려면 필요한 것

직접 배포까지 진행하려면 아래 중 하나가 필요합니다.

- 이 터미널에서 `vercel` CLI가 이미 로그인된 상태
- 또는 사용자의 `Vercel` 프로젝트 접근 권한
- 그리고 `Supabase Project URL`, `service_role key`

권한이 없는 상태에서는 제가 코드를 배포 준비 상태로 만드는 것까지는 가능하지만, 실제 운영 배포는 사용자의 계정 인증이 필요합니다.
