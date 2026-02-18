# AInote - AI 노트 앱 구현 계획

## Context

Next.js 기반의 Notion 스타일 AI 노트 앱을 처음부터 구축한다. 협업 기능, AI 글쓰기 보조, RAG 기반 Q&A, 노트 분석/정리 기능을 포함하는 범용 노트 플랫폼이다. 홈서버(Ubuntu 24.04)에 Docker로 배포하며, 기존 인프라(PostgreSQL, Redis, Nginx)를 재사용한다.

---

## 확정된 요구사항

| 항목 | 결정 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 에디터 | BlockNote (Notion 스타일 블록 에디터) |
| UI 라이브러리 | shadcn/ui + Mantine (BlockNote 내부용) |
| 애니메이션 | Motion (Framer Motion) |
| 아이콘 | Lucide Icons |
| 테마 | next-themes (다크모드 우선) |
| 커맨드 팔레트 | cmdk (shadcn/ui Command) |
| 토스트 | Sonner |
| DB | 기존 PostgreSQL 16 재사용 + pgvector |
| 캐시 | 기존 Redis 7 재사용 |
| ORM | Prisma 6 |
| 인증 | Auth.js v5 (NextAuth) |
| 협업 | Yjs + Hocuspocus (WebSocket) |
| AI SDK | Vercel AI SDK 4 (멀티 프로바이더) |
| AI 모델 | API 키 (OpenAI/Claude/Gemini) - Ollama는 나중에 추가 가능 |
| 도메인 | wonryeol-ai-note.kro.kr |
| 배포 | Docker + 기존 Nginx/Certbot |
| 앱 포트 | 3100 (3000은 raid-together 사용 중) |
| 협업 서버 포트 | 3101 |

---

## 홈서버 현황 (재사용할 인프라)

- **PostgreSQL 16** - `localhost:5432` (user: postgres, 새 DB `ainote` 생성)
- **Redis 7** - `localhost:6379` (세션 캐시/레이트 리밋용)
- **Nginx** - 리버스 프록시 + Certbot SSL
- **GPU** - GeForce MX450 (2GB VRAM) - 향후 Ollama 추가 시 사용 가능
- **디스크** - 386GB 여유 / **RAM** - 16GB (10GB 여유)
- **배포 패턴** - `~/docker/ainote/docker-compose.yml`

---

## 기술 스택

### Frontend
| 패키지 | 용도 |
|---------|------|
| `next` 15.x | 프레임워크 |
| `react` 19.x | UI |
| `@blocknote/react`, `@blocknote/mantine` | 블록 에디터 |
| `@blocknote/xl-ai` | 에디터 AI 기능 |
| `shadcn/ui` (Radix UI + Tailwind) | UI 컴포넌트 |
| `tailwindcss` 4.x | 스타일링 |
| `motion` | 애니메이션 |
| `lucide-react` | 아이콘 |
| `next-themes` | 다크/라이트 모드 |
| `sonner` | 토스트 알림 |
| `cmdk` | 커맨드 팔레트 (Cmd+K) |
| `zustand` | 클라이언트 상태 |
| `yjs` + `@hocuspocus/provider` | 실시간 협업 |
| `ai` (Vercel AI SDK) | AI 스트리밍 |

### Backend
| 패키지 | 용도 |
|---------|------|
| `next-auth` v5 | 인증 |
| `prisma` 6.x | ORM |
| `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google` | AI 프로바이더 |
| `@blocknote/xl-ai/server` | BlockNote AI 서버 |
| `@hocuspocus/server` + `@hocuspocus/extension-database` | 협업 서버 |
| `bcryptjs` | 비밀번호 해싱 |

### Infrastructure
| 기술 | 용도 |
|------|------|
| PostgreSQL 16 + pgvector | DB + 벡터 검색 |
| Redis 7 | 캐시/세션 |
| Nginx + Certbot | 리버스 프록시 + SSL |
| Docker + Docker Compose | 컨테이너 |

---

## 데이터베이스 스키마 (핵심)

```prisma
// 주요 모델만 요약

model User {
  id, name, email, passwordHash, image
  accounts, sessions, workspaceMembers, aiSettings, aiConversations
}

model UserAISettings {
  userId, defaultProvider, defaultModel
  openaiApiKey?, anthropicApiKey?, googleApiKey?  // AES-256 암호화
}

model Workspace {
  id, name, icon
  members[], notes[]
}

model WorkspaceMember {
  workspaceId, userId, role ("owner"|"admin"|"member")
}

model Note {
  id, workspaceId, parentId? (트리 구조)
  title, icon?, coverImage?
  isArchived, isFavorite, sortOrder
  yjsState (Bytes - Yjs 문서 바이너리)
  children[], tags[], embeddings[], aiConversations[]
}

model Tag { workspaceId, name, color }
model NoteTag { noteId, tagId, isAISuggested }

model NoteEmbedding {
  noteId, chunkIndex, content
  embedding (vector 1536)  // pgvector
}

model AIConversation { userId, noteId?, title, messages[] }
model AIMessage { conversationId, role, content, model? }
```

---

## 폴더 구조

```
ainote/
├── docker-compose.yml
├── Dockerfile
├── prisma/schema.prisma
├── collab-server/          # Hocuspocus 독립 서버
│   ├── Dockerfile
│   └── src/index.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login, register
│   │   ├── (main)/
│   │   │   ├── dashboard/
│   │   │   ├── workspace/[workspaceId]/[noteId]/   # 핵심: 에디터
│   │   │   ├── ai-chat/[chatId]/
│   │   │   ├── settings/ai/
│   │   │   └── trash/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── ai/chat/, rag/, suggest-tags/, summarize/
│   │       ├── notes/[noteId]/
│   │       └── workspaces/
│   ├── components/
│   │   ├── editor/NoteEditor, CollaborationProvider, AIMenuController
│   │   ├── layout/Sidebar, SidebarNoteTree, TopBar, CommandPalette
│   │   ├── ai/AIChatPanel, AIModelSelector, TagSuggestions
│   │   └── ui/ (shadcn/ui 컴포넌트)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── ai/providers.ts, embeddings.ts, rag.ts, chunker.ts
│   │   ├── collaboration/hocuspocus.ts
│   │   └── encryption.ts
│   ├── hooks/
│   └── stores/
```

---

## AI 아키텍처

### 1. 멀티 모델 프로바이더 (`lib/ai/providers.ts`)
- Vercel AI SDK로 OpenAI, Anthropic, Google 통합
- 사용자가 설정에서 API 키 입력 + 모델 선택
- API 키는 AES-256-GCM으로 암호화 저장
- Ollama는 향후 프로바이더로 추가 가능 (구조적으로 대비)

### 2. 글쓰기 보조 (`@blocknote/xl-ai`)
- BlockNote 내장 AI 확장 사용
- `/api/ai/chat` 엔드포인트로 스트리밍
- 자동완성, 문체 개선, 번역, 요약

### 3. RAG Q&A (`lib/ai/rag.ts`)
- 노트 저장 시 → 텍스트 청킹 → 임베딩 생성 → pgvector 저장
- 질문 시 → 쿼리 임베딩 → pgvector 코사인 유사도 검색 (top-10) → LLM에 컨텍스트 주입 → 스트리밍 응답
- 임베딩 모델: `text-embedding-3-small` (1536차원)

### 4. 노트 분석
- 태그 자동 추천: 노트 저장 시 LLM이 내용 분석 → 태그 제안
- 관련 노트: pgvector 유사도로 가장 가까운 노트 5개 표시

---

## 협업 아키텍처

- **Hocuspocus** 독립 프로세스 (port 3101)
- BlockNote ↔ Yjs ↔ Hocuspocus ↔ PostgreSQL
- JWT 기반 인증 (워크스페이스 멤버십 확인)
- 비활성 2-5초 후 DB에 자동 저장
- 커서 위치 + 사용자 이름 실시간 표시

---

## 배포 아키텍처

```
Internet → ASUS Router (80,443 → 192.168.50.95)
  → Nginx (wonryeol-ai-note.kro.kr)
    → / → localhost:3100 (Next.js)
    → /collab → localhost:3101 (Hocuspocus WebSocket)

기존 인프라 재사용:
  → PostgreSQL :5432 (ainote 데이터베이스)
  → Redis :6379
```

### docker-compose.yml (~/docker/ainote/)
```yaml
services:
  app:
    build: .
    ports: ["127.0.0.1:3100:3000"]
    environment:
      DATABASE_URL: postgresql://postgres:***@host.docker.internal:5432/ainote
      REDIS_URL: redis://host.docker.internal:6379
    extra_hosts: ["host.docker.internal:host-gateway"]

  collab:
    build: ./collab-server
    ports: ["127.0.0.1:3101:1234"]
    environment:
      DATABASE_URL: postgresql://postgres:***@host.docker.internal:5432/ainote
    extra_hosts: ["host.docker.internal:host-gateway"]
```

### Nginx 설정 (/etc/nginx/sites-available/ainote)
```nginx
server {
    server_name wonryeol-ai-note.kro.kr;

    location / { proxy_pass http://localhost:3100; }
    location /collab {
        proxy_pass http://localhost:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    # SSL by Certbot
}
```

---

## UI 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  TopBar: 브레드크럼   |  공유  |  AI채팅  |  설정       │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │              메인 콘텐츠                     │
│          │                                              │
│ 🔍검색   │  노트 제목 (편집 가능 h1)                    │
│          │  ───────────────────────────────             │
│ ⭐즐겨찾기│  BlockNote 에디터                            │
│ · Note1  │  (블록 기반, 실시간 협업)                     │
│ · Note2  │                                              │
│          │  / = 슬래시 메뉴 (AI 명령 포함)              │
│ 📄페이지  │  텍스트 선택 = 포맷 바 + AI 버튼            │
│ ▶ Page1  │                                              │
│   Page2  │  [협업자 커서 실시간 표시]                    │
│ ▶ Page3  │                                              │
│          │       ┌── AI 채팅 패널 (슬라이드인) ──┐      │
│ 🗑휴지통  │       │ 이 노트에 대해 질문하세요...  │      │
│          │       │ [채팅 메시지들]               │      │
│          │       │ [입력창]                      │      │
└──────────┴───────┴───────────────────────────────┴──────┘
```

---

## 구현 단계 (7 Phase)

### Phase 1: 기반 구축 ✅
1. Next.js 15 프로젝트 초기화 (TypeScript, Tailwind 4, App Router)
2. shadcn/ui 설치 + 다크 테마 기본 설정 (next-themes)
3. Prisma 스키마 작성 + pgvector 확장 설치 (기존 PostgreSQL에)
4. Auth.js v5 설정 (이메일/비밀번호 인증)
5. 기본 레이아웃 (사이드바, 탑바, 라우팅)

### Phase 2: 핵심 에디터 ✅
6. BlockNote 에디터 통합 + 기본 노트 CRUD
7. 워크스페이스 + 노트 트리 (사이드바 네비게이션)
8. 노트 생성/읽기/수정/삭제/보관 API

### Phase 3: 협업 ✅
9. Hocuspocus 독립 서버 구축 (JWT 인증)
10. BlockNote Yjs 연동
11. 커서 프레전스 UI
12. PostgreSQL에 Yjs 상태 자동 저장

### Phase 4: AI 글쓰기 보조 ✅
13. `@blocknote/xl-ai` 설정 + 커스텀 API 라우트
14. 멀티 모델 프로바이더 팩토리 (providers.ts)
15. AI 설정 페이지 (API 키 관리, 암호화)

### Phase 5: RAG & Q&A ✅
17. 텍스트 청킹 + 임베딩 생성 파이프라인
18. pgvector 유사도 검색 쿼리
19. RAG 엔드포인트 (컨텍스트 주입 + 스트리밍)
20. AI 채팅 UI (패널 + 전체 페이지)
21. 대화 히스토리 저장

### Phase 6: 스마트 기능 ✅
22. 태그 자동 추천
23. 관련 노트 (벡터 유사도)
24. 커맨드 팔레트 (Cmd+K) - cmdk
25. 대시보드 (최근/즐겨찾기/추천 노트)

### Phase 7: 배포 & 마무리 ✅
26. Docker 빌드 최적화
27. 홈서버 배포 (docker-compose + Nginx + Certbot SSL)
28. 성능 테스트 + 최적화
29. 백업 전략 (기존 backup.sh에 ainote DB 추가)

---

## 검증 방법

1. **로컬 개발**: `npm run dev`로 로컬에서 전체 기능 테스트
2. **에디터**: BlockNote 블록 생성/삭제/드래그/슬래시 메뉴 동작 확인
3. **협업**: 브라우저 2개로 동시 편집 + 커서 표시 확인
4. **AI**: 텍스트 선택 → AI 개선/번역/요약 동작 확인
5. **RAG**: 노트 작성 후 AI 채팅에서 질문 → 노트 내용 기반 답변 확인
6. **배포**: `docker compose up -d` → `https://wonryeol-ai-note.kro.kr` 접속 확인
7. **SSL**: `curl -I https://wonryeol-ai-note.kro.kr` 로 인증서 확인
