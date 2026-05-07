# 친구 일정 조율 사이트 구현계획서

## 1. 목표

기획서의 MVP를 기준으로, 여러 사용자가 초대코드로 방에 입장하고 가능한 날짜를 입력하면 공통 가능한 날짜를 계산해 보여주는 웹서비스를 구현한다.

## 2. 권장 기술 스택

### 프론트엔드
- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`

### 백엔드
- Next.js API Route 또는 Route Handler
- 서버 액션 또는 REST API

### 데이터베이스
- `PostgreSQL` 또는 초기 MVP는 `Supabase Postgres`

### 배포
- `Vercel`
- DB는 `Supabase`

## 3. 권장 아키텍처

### 구성
- 클라이언트: 화면 렌더링, 입력 처리, 날짜 선택 UI
- 서버: 초대코드 생성, 유효성 검증, 데이터 저장, 결과 계산
- DB: 방 정보와 참여자 정보 저장

### 이유
- 일정 조율 서비스는 읽기/쓰기 구조가 단순해 CRUD 중심 설계가 적합
- Next.js 하나로 프론트와 API를 같이 운영하면 초기 개발 속도가 빠름
- Supabase를 쓰면 인증 없이도 빠르게 DB 구축 가능

## 4. 핵심 도메인 설계

### 4.1 Room 테이블
| 필드명 | 타입 | 설명 |
|---|---|---|
| id | uuid | 방 고유 ID |
| invite_code | varchar(6) | 6자리 초대코드 |
| host_name | varchar(50) | 방장 닉네임 |
| start_date | date | 시작일 |
| end_date | date | 종료일 |
| created_at | timestamp | 생성 시간 |
| expires_at | timestamp | 만료 시간 |
| status | varchar(20) | active, closed, expired |

### 4.2 Participant 테이블
| 필드명 | 타입 | 설명 |
|---|---|---|
| id | uuid | 참여자 고유 ID |
| room_id | uuid | 방 ID |
| nickname | varchar(50) | 닉네임 |
| is_host | boolean | 방장 여부 |
| created_at | timestamp | 참여 시간 |

### 4.3 ParticipantAvailability 테이블
| 필드명 | 타입 | 설명 |
|---|---|---|
| id | uuid | 고유 ID |
| participant_id | uuid | 참여자 ID |
| room_id | uuid | 방 ID |
| available_date | date | 가능한 날짜 |

### 설계 포인트
- 가능한 날짜를 배열 한 칼럼에 넣기보다 한 날짜씩 row로 저장하면 집계가 쉬움
- 날짜별 참여자 수 계산이 간단해짐
- 공통 날짜와 인기 날짜 추천 로직 확장에 유리함

## 5. 기능별 구현 계획

### 5.1 첫 화면
#### 기능
- `초대코드 만들기`
- `초대코드 입력`

#### 구현
- 메인 페이지 `/`
- 두 버튼을 카드형 CTA로 배치
- 각 버튼은 `/create`, `/join`으로 이동

### 5.2 방 생성
#### 기능
- 6자리 숫자 코드 생성
- 닉네임 입력
- 시작일/종료일 입력
- 가능한 날짜 선택

#### 구현 순서
1. `/create` 페이지 구성
2. 서버에서 중복 없는 초대코드 생성 API 작성
3. 날짜 범위 유효성 검사
4. 범위 내 날짜 리스트 생성
5. 다중 날짜 선택 UI 구현
6. 제출 시 room, participant, availability 저장

#### API 예시
- `POST /api/rooms`

요청 예시:
```json
{
  "hostName": "민지",
  "startDate": "2026-05-10",
  "endDate": "2026-05-20",
  "availableDates": ["2026-05-12", "2026-05-14"]
}
```

응답 예시:
```json
{
  "roomId": "uuid",
  "inviteCode": "483291"
}
```

### 5.3 방 참여
#### 기능
- 초대코드 입력 및 검증
- 닉네임 입력
- 날짜 선택 및 제출

#### 구현 순서
1. `/join` 페이지 구성
2. 코드 검증 API 작성
3. 유효 코드면 닉네임 및 날짜 선택 화면으로 이동
4. 참여자와 가능 날짜 저장

#### API 예시
- `GET /api/rooms/{inviteCode}`
- `POST /api/rooms/{inviteCode}/participants`

참여 요청 예시:
```json
{
  "nickname": "지수",
  "availableDates": ["2026-05-13", "2026-05-14", "2026-05-15"]
}
```

### 5.4 결과 조회
#### 기능
- 공통 가능한 날짜 계산
- 참여자별 가능 날짜 조회
- 날짜별 가능 인원 수 확인

#### 구현 순서
1. `GET /api/rooms/{inviteCode}/results` 구현
2. 날짜별 집계 쿼리 작성
3. 전체 참여자 수와 동일한 날짜를 공통 후보로 계산
4. 결과 페이지 `/room/{inviteCode}`에서 시각화

#### 결과 응답 예시
```json
{
  "inviteCode": "483291",
  "dateRange": {
    "startDate": "2026-05-10",
    "endDate": "2026-05-20"
  },
  "participants": [
    {
      "nickname": "민지",
      "availableDates": ["2026-05-12", "2026-05-14"]
    },
    {
      "nickname": "지수",
      "availableDates": ["2026-05-14", "2026-05-15"]
    }
  ],
  "commonDates": ["2026-05-14"],
  "rankedDates": [
    { "date": "2026-05-14", "count": 2 },
    { "date": "2026-05-12", "count": 1 },
    { "date": "2026-05-15", "count": 1 }
  ]
}
```

## 6. UI/UX 구현 포인트

### 공통
- 모바일 우선 설계
- 로그인 없는 서비스이므로 입력 흐름을 최대한 짧게 구성
- 큰 버튼과 직관적인 단계 표시 필요

### 날짜 선택 UI
- 달력 기반 또는 날짜 리스트 기반 중 택1
- MVP는 구현 단순성을 위해 날짜 리스트 체크 방식이 적합
- 이후 캘린더 셀 다중 선택으로 고도화 가능

### 결과 화면
- 상단: 모두 가능한 날짜
- 중단: 날짜별 가능 인원 수
- 하단: 참여자별 가능한 날짜

## 7. 유효성 검사 및 예외 처리

### 프론트엔드
- 초대코드는 숫자 6자리만 입력 허용
- 닉네임 공백 체크
- 시작일/종료일 필수 체크
- 가능한 날짜 최소 1개 선택 체크

### 백엔드
- 초대코드 중복 생성 방지
- 존재하지 않는 코드 차단
- 만료된 방 참여 차단
- 날짜 범위 밖 선택 데이터 거부
- 비정상 payload 차단

## 8. 공통 날짜 계산 로직

### 기본 로직
1. 특정 방의 전체 참여자 수 조회
2. 날짜별 가능한 참여자 수 집계
3. 집계 수가 전체 참여자 수와 같으면 공통 날짜
4. 공통 날짜가 없으면 count 내림차순으로 후보 추천

### SQL 개념 예시
```sql
SELECT available_date, COUNT(DISTINCT participant_id) AS count
FROM participant_availability
WHERE room_id = $1
GROUP BY available_date
ORDER BY count DESC, available_date ASC;
```

## 9. 개발 단계 제안

### 1단계: 기초 세팅
- Next.js 프로젝트 생성
- Tailwind 설정
- DB 연결
- 기본 라우팅 생성

### 2단계: 방 생성 플로우
- 첫 화면 구현
- 방 생성 화면 구현
- 초대코드 생성 API 구현
- 방/방장 저장 구현

### 3단계: 참여 플로우
- 초대코드 검증 화면 구현
- 참여자 입력 및 날짜 선택 구현
- 참여자 데이터 저장 구현

### 4단계: 결과 화면
- 공통 날짜 계산 API 구현
- 결과 화면 UI 구현
- 날짜별 집계 표시

### 5단계: 안정화
- 예외 처리
- 중복 제출 방지
- 만료 정책 추가
- 반응형 마무리

## 10. 파일 구조 예시

```text
src/
  app/
    page.tsx
    create/page.tsx
    join/page.tsx
    room/[inviteCode]/page.tsx
    api/
      rooms/route.ts
      rooms/[inviteCode]/route.ts
      rooms/[inviteCode]/participants/route.ts
      rooms/[inviteCode]/results/route.ts
  components/
    invite-code-card.tsx
    nickname-form.tsx
    date-range-form.tsx
    available-dates-picker.tsx
    results-summary.tsx
  lib/
    db.ts
    invite-code.ts
    date-utils.ts
    validation.ts
```

## 11. 테스트 계획

### 기능 테스트
- 방 생성 시 6자리 코드가 발급되는지
- 중복 코드가 생성되지 않는지
- 잘못된 코드 입력 시 차단되는지
- 날짜 범위 밖 날짜가 저장되지 않는지
- 여러 명 입력 후 공통 날짜가 정확히 계산되는지

### 예외 테스트
- 빈 닉네임 제출
- 날짜 미선택 제출
- 존재하지 않는 방 조회
- 만료된 방 참여

## 12. MVP 이후 개선 우선순위

### 우선순위 높음
- 링크 기반 초대
- 새로고침 후 재입장 처리
- 방장 권한 강화
- 결과 화면 가독성 개선

### 우선순위 중간
- 시간대 선택
- 가장 최적 날짜 자동 강조
- 참여 완료 여부 표시

### 우선순위 낮음
- 소셜 로그인
- 알림 기능
- 외부 캘린더 연동

## 13. 바로 개발 시작 시 추천 순서

1. Next.js + Tailwind + Supabase 기반 프로젝트 생성
2. DB 스키마부터 정의
3. 방 생성 API와 첫 화면 구현
4. 참여 플로우 구현
5. 결과 집계 API와 결과 화면 구현
6. 마지막으로 예외 처리와 모바일 UI 정리

## 14. 의사결정 메모

### 왜 로그인 없이 시작하는가
- 친구끼리 빠르게 쓰는 서비스라 진입장벽이 낮아야 함
- MVP 검증 단계에서는 인증보다 입력 속도가 중요함

### 왜 초대코드를 숫자 6자리로 하는가
- 모바일 메신저로 전달하기 쉬움
- 사용자가 기억하고 입력하기 쉬움

### 왜 날짜 범위를 방장이 먼저 정하는가
- 참여자 입력 범위를 통일해 결과 계산을 단순화할 수 있음
- UX가 단순해지고 잘못된 입력을 줄일 수 있음
