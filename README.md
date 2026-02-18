# AInote

**Notion 스타일 AI 노트 앱** - 블록 에디터, 실시간 협업, AI 글쓰기 보조, RAG 기반 Q&A를 갖춘 셀프호스팅 노트 플랫폼

## 주요 기능

### 블록 에디터
- [BlockNote](https://www.blocknotejs.org/) 기반 Notion 스타일 블록 에디터
- `/` 슬래시 메뉴로 블록 생성 (텍스트, 헤딩, 리스트, 코드, 이미지 등)
- 마크다운(`.md`) 파일 가져오기 (슬래시 메뉴에서 바로 업로드)
- 드래그 앤 드롭으로 블록 재정렬
- 노트 자동 저장 (2초 디바운스)

### 실시간 협업
- [Yjs](https://yjs.dev/) + [Hocuspocus](https://tiptap.dev/hocuspocus) 기반 CRDT 동기화
- 워크스페이스 단위 멤버 관리 (owner / admin / member)
- 커서 프레전스 - 동시 편집자 위치 실시간 표시
- JWT 기반 협업 인증

### AI 기능
- **멀티 모델 지원** - OpenAI, Anthropic (Claude), Google (Gemini) 중 선택
- **RAG Q&A** - 노트 내용 기반 질문-답변 (pgvector 코사인 유사도 검색)
- **태그 자동 추천** - AI가 노트 내용을 분석하여 태그 제안
- **요약** - 노트 내용 자동 요약
- **API 키 암호화** - AES-256-GCM으로 사용자 API 키 안전 저장

### 스마트 기능
- 커맨드 팔레트 (`Cmd+K`) - 노트 검색, 빠른 이동
- 대시보드 - 최근 편집, 즐겨찾기, 전체 노트
- 노트 트리 - 부모-자식 관계의 계층적 노트 구조
- 즐겨찾기, 보관(휴지통), 복원
- 리사이즈 가능한 사이드바

---

## 기술 스택

### Frontend
| 기술 | 용도 |
|------|------|
| Next.js 16 | App Router 프레임워크 |
| React 19 | UI 라이브러리 |
| BlockNote | Notion 스타일 블록 에디터 |
| shadcn/ui | UI 컴포넌트 (Radix UI 기반) |
| Tailwind CSS 4 | 스타일링 |
| Zustand | 클라이언트 상태 관리 |
| Yjs | 실시간 협업 (CRDT) |
| Vercel AI SDK | AI 스트리밍 응답 |
| next-themes | 다크/라이트 모드 |
| cmdk | 커맨드 팔레트 |
| Lucide Icons | 아이콘 |
| Sonner | 토스트 알림 |

### Backend
| 기술 | 용도 |
|------|------|
| Auth.js v5 | 인증 (이메일/비밀번호) |
| Prisma 6 | ORM |
| Hocuspocus | WebSocket 협업 서버 |
| bcryptjs | 비밀번호 해싱 |

### AI
| 기술 | 용도 |
|------|------|
| @ai-sdk/openai | OpenAI GPT 모델 |
| @ai-sdk/anthropic | Anthropic Claude 모델 |
| @ai-sdk/google | Google Gemini 모델 |
| text-embedding-3-small | 임베딩 (1536차원) |

### Infrastructure
| 기술 | 용도 |
|------|------|
| PostgreSQL 16 + pgvector | DB + 벡터 검색 |
| Redis 7 | 캐시 / 세션 |
| Docker + Docker Compose | 컨테이너화 |
| Nginx + Certbot | 리버스 프록시 + SSL |

---

## 아키텍처

```
Client (Browser)
    |
    +-- HTTPS --> Nginx (SSL)
    |                |
    |                +-- / --> Next.js App (port 3100)
    |                |         |
    |                |         +-- API Routes (/api/*)
    |                |         +-- Server Components
    |                |         +-- Auth.js (JWT Sessions)
    |                |
    |                +-- /collab --> Hocuspocus (port 3101)
    |                               |
    |                               +-- Yjs WebSocket
    |                               +-- JWT Auth
    |
    +-- PostgreSQL 16 (pgvector)
    |     +-- Users, Workspaces, Notes
    |     +-- AI Conversations
    |     +-- Note Embeddings (vector 1536)
    |
    +-- Redis 7
          +-- Session Cache
```

### RAG 파이프라인

```
노트 저장 --> 텍스트 청킹 (500자, 50자 오버랩)
           --> OpenAI Embedding (text-embedding-3-small)
           --> pgvector 저장

질문 입력 --> 쿼리 임베딩 생성
          --> pgvector 코사인 유사도 검색 (top-10)
          --> 관련 청크를 LLM 컨텍스트에 주입
          --> 스트리밍 응답
```

---

## 프로젝트 구조

```
ainote/
├── docker-compose.yml          # Docker 서비스 정의
├── Dockerfile                  # Next.js 멀티 스테이지 빌드
├── prisma/
│   └── schema.prisma          # 13개 모델 (User, Note, Workspace, AI...)
├── collab-server/             # Hocuspocus 독립 협업 서버
│   ├── Dockerfile
│   └── src/index.ts
├── deploy/
│   └── nginx-ainote.conf      # Nginx 리버스 프록시 설정
└── src/
    ├── app/
    │   ├── (auth)/            # 로그인, 회원가입
    │   ├── (main)/            # 인증 필요 페이지
    │   │   ├── dashboard/     # 대시보드
    │   │   ├── workspace/     # 에디터 (핵심)
    │   │   ├── ai-chat/       # AI 채팅
    │   │   ├── settings/      # AI 설정
    │   │   └── trash/         # 휴지통
    │   └── api/               # 14개 API 라우트
    │       ├── auth/          # 인증 API
    │       ├── ai/            # AI 관련 (chat, rag, summarize, suggest-tags)
    │       ├── notes/         # 노트 CRUD + 임베딩
    │       └── workspaces/    # 워크스페이스 관리
    ├── components/
    │   ├── editor/            # BlockNote 에디터, 협업 프로바이더
    │   ├── layout/            # 사이드바, 탑바, 커맨드 팔레트
    │   ├── ai/                # AI 채팅 패널
    │   └── ui/                # shadcn/ui 컴포넌트 (15개)
    ├── lib/
    │   ├── ai/                # 프로바이더, 임베딩, RAG, 청킹
    │   ├── auth.ts            # Auth.js 설정
    │   ├── prisma.ts          # Prisma 클라이언트
    │   └── encryption.ts      # AES-256-GCM 암호화
    └── stores/                # Zustand 상태 (sidebar, workspace)
```

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL 16 + pgvector 확장
- Redis 7

### 로컬 개발

```bash
# 의존성 설치
npm install
cd collab-server && npm install && cd ..

# PostgreSQL에 pgvector 확장 설치
psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 데이터베이스 생성
psql -U postgres -c "CREATE DATABASE ainote;"

# 환경변수 설정
cp .env.example .env
# .env 파일 편집 - DATABASE_URL, AUTH_SECRET 등 설정

# Prisma 마이그레이션
npx prisma migrate dev

# 개발 서버 시작
npm run dev

# 협업 서버 시작 (별도 터미널)
cd collab-server && npm run dev
```

### Docker 배포

```bash
# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 빌드 및 실행
docker compose build
docker compose up -d

# Prisma 마이그레이션 (첫 배포 시)
docker compose exec app npx prisma migrate deploy

# Nginx 설정
sudo cp deploy/nginx-ainote.conf /etc/nginx/sites-available/ainote
sudo ln -sf /etc/nginx/sites-available/ainote /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL 인증서 (Certbot)
sudo certbot --nginx -d your-domain.com
```

---

## 환경변수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `REDIS_URL` | Redis 연결 문자열 |
| `AUTH_SECRET` | NextAuth JWT 시크릿 |
| `ENCRYPTION_KEY` | API 키 암호화 키 (AES-256, 64자 hex) |
| `COLLAB_JWT_SECRET` | 협업 서버 JWT 시크릿 |

---

## 데이터베이스 스키마

13개 Prisma 모델:

- **User** - 사용자 계정
- **Account / Session / VerificationToken** - Auth.js 인증
- **UserAISettings** - 사용자별 AI 설정 (API 키 암호화 저장)
- **Workspace** - 워크스페이스
- **WorkspaceMember** - 멤버십 (owner/admin/member)
- **Note** - 노트 (트리 구조, Yjs 바이너리 상태)
- **Tag / NoteTag** - 태그 시스템 (AI 자동 추천 포함)
- **NoteEmbedding** - pgvector 임베딩 (1536차원)
- **AIConversation / AIMessage** - AI 채팅 히스토리

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth 인증 |
| GET/POST | `/api/workspaces` | 워크스페이스 목록/생성 |
| GET/POST | `/api/notes` | 노트 목록/생성 |
| GET/PATCH/DELETE | `/api/notes/[noteId]` | 노트 조회/수정/삭제 |
| POST | `/api/notes/[noteId]/embed` | 노트 임베딩 생성 |
| GET/PUT | `/api/ai/settings` | AI 설정 조회/수정 |
| POST | `/api/ai/chat` | AI 채팅 (스트리밍) |
| POST | `/api/ai/rag` | RAG Q&A (스트리밍) |
| POST | `/api/ai/suggest-tags` | 태그 자동 추천 |
| POST | `/api/ai/summarize` | 노트 요약 |
| GET/POST | `/api/ai/conversations` | 대화 목록/생성 |
| GET/POST | `/api/ai/conversations/[id]/messages` | 메시지 조회/추가 |
| POST | `/api/collab/token` | 협업 JWT 토큰 발급 |

---

## 라이선스

MIT
