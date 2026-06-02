---
trigger: always_on
---

# OmniVoice Studio — Coding Style Guide

> **Mục đích**: Hướng dẫn thống nhất cho mọi AI agent (Antigravity, Claude, Gemini, Cursor) và developer khi viết code cho dự án. Rút từ patterns thực tế trong codebase, không phải quy tắc bịa ra.

---

## 1. Kiến trúc tổng quan

```
Frontend (React + Zustand)          Backend (FastAPI + Python)
─────────────────────────           ──────────────────────────
pages/      → Smart views           api/routers/ → REST endpoints
components/ → Reusable UI           services/    → Business logic
hooks/      → Custom logic hooks    engines/     → TTS sidecar processes
store/      → Zustand slices        core/        → Config, DB, events
api/        → API call wrappers     schemas/     → Pydantic models
ui/         → Design system         utils/       → Helper functions
utils/      → Pure utilities
```

---

## 2. Mô hình lập trình

### ✅ Functional Programming — KHÔNG dùng OOP

```jsx
// ✅ ĐÚNG: function component + hooks
export default function CloneDesignTab(props) { ... }

// ❌ SAI: class component
class CloneDesignTab extends React.Component { ... }
```

**Ngoại lệ duy nhất**: `ApiError` class trong `api/client.ts` — vì cần extends `Error`.

### Quy tắc cốt lõi

| Hạng mục | Đặt ở đâu |
|---|---|
| State app-level | Store slice (`store/xxxSlice.ts`) |
| State chỉ 1 component | `useState` local |
| Logic nghiệp vụ | Custom hook (`hooks/useXxx.js`) |
| UI tái sử dụng | `components/` hoặc `ui/` |
| Smart views (biết state) | `pages/` |
| API calls | `api/` folder — wrap `apiFetch`/`apiJson` từ `client.ts` |
| Constants | `utils/constants.js` |

---

## 3. Frontend — Naming Convention

### Files

| Loại | Convention | Ví dụ |
|---|---|---|
| Components / Pages | `PascalCase.jsx` + `PascalCase.css` | `CloneDesignTab.jsx`, `Sidebar.jsx` |
| Hooks | `useCamelCase.js` | `useTTS.js`, `useAppData.js` |
| Store slices | `camelCaseSlice.ts` | `generateSlice.ts`, `uiSlice.ts` |
| API modules | `camelCase.ts` | `generate.ts`, `client.ts` |
| Utils | `camelCase.js` | `constants.js`, `media.js` |
| UI primitives | `PascalCase.jsx` + `PascalCase.css` | `Button.jsx`, `Dialog.jsx` |

### Code

```jsx
// Component: PascalCase
export default function VoiceProfile(props) { ... }

// Hook: useCamelCase
export default function useTTS({ ... }) { ... }

// Constants: UPPER_SNAKE_CASE
export const CLONE_MAX_SECONDS = 15;
export const POPULAR_LANGS = [...];

// Props / variables: camelCase
const selectedProfile = useAppStore(s => s.selectedProfile);

// CSS classes: kebab-case (BEM-like)
<div className="clone-profile-banner__label" />
<button className="preset-btn clone-profile-card" />
```

---

## 4. Frontend — Import Order

Theo thứ tự codebase hiện tại:

```jsx
// 1. React core
import React, { useState, useRef, useEffect, useCallback } from 'react';

// 2. Third-party libraries
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// 3. Lucide icons (destructured import)
import { Play, Trash2, Save, Settings2 } from 'lucide-react';

// 4. Internal: store
import { useAppStore } from '../store';

// 5. Internal: UI primitives
import { Button, Input, Slider, Progress } from '../ui';

// 6. Internal: components / pages
import SearchableSelect from '../components/SearchableSelect';

// 7. Internal: API / hooks / utils
import { API } from '../api/client';
import useTTS from '../hooks/useTTS';
import { POPULAR_LANGS, PRESETS } from '../utils/constants';

// 8. CSS (cuối cùng)
import './CloneDesignTab.css';
```

---

## 5. Frontend — Zustand Store Patterns

### Slice Pattern

Mỗi domain = 1 file slice riêng:

```ts
// store/generateSlice.ts
export interface GenerateSlice {
  steps: number;
  setSteps: (v: number) => void;
}

export const createGenerateSlice: StateCreator<GenerateSlice> = (set) => ({
  steps: 64,
  setSteps: (v) => set({ steps: v }),
});
```

### Compose trong store/index.ts

```ts
export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createGenerateSlice(set, get, api),
      ...createPrefsSlice(set, get, api),
      // ...thêm slice mới ở đây
    }),
    { name: 'omnivoice.app', partialize: (s) => ({ ... }) }
  ),
);
```

### Khi nào dùng store vs useState

| Dùng store | Dùng useState |
|---|---|
| State cần persist (localStorage) | State UI tạm (loading, modal open) |
| State dùng ở ≥2 components | State chỉ dùng trong 1 component |
| State cần chia sẻ qua hooks | Ref cho DOM element |

---

## 6. Frontend — Component Patterns

### Props threading — Hiện tại dùng prop-drilling

```jsx
// App.jsx truyền props xuống pages/components
<CloneDesignTab
  steps={steps} setSteps={setSteps}
  cfg={cfg} setCfg={setCfg}
  ... // nhiều props
/>
```

> **LƯU Ý**: Project đang trong quá trình chuyển sang Zustand selectors (`useAppStore(s => s.xxx)`). Code mới NÊN dùng selectors trực tiếp trong component thay vì prop-drilling khi có thể.

### Lazy Loading

Components nặng dùng `React.lazy()`:

```jsx
const Settings = lazy(() => import('./pages/Settings'));

// Render với Suspense + ErrorBoundary
<ErrorBoundary name="settings">
  <Suspense fallback={<LazyFallback />}>
    <Settings />
  </Suspense>
</ErrorBoundary>
```

### Design System (ui/)

**PHẢI** import UI primitives từ barrel file:

```jsx
// ✅ ĐÚNG
import { Button, Input, Slider } from '../ui';

// ❌ SAI
import Button from '../ui/Button.jsx';
```

---

## 7. Frontend — CSS Patterns

### Convention: Global CSS, BEM-like naming

```css
/* Component-scoped via .component-name prefix */
.clone-split-grid { ... }
.clone-profile-banner { ... }
.clone-profile-banner__label { ... }  /* BEM element */
.clone-profile-card.profile-active { ... }  /* modifier */

/* Utility: val-bubble, label-row, grid-2, grid-4 */
.label-row { ... }
.label-row--spread { ... }  /* BEM modifier */
.label-row--sm { ... }
```

### CSS Variables — Token system

```css
/* Tokens từ ui/tokens.css — PHẢI dùng thay vì hardcode màu */
var(--bg-0)      /* background chính */
var(--bg-1)      /* surface */
var(--fg-0)      /* text chính */
var(--accent)    /* màu nhấn */
var(--radius-md) /* border radius */
```

---

## 8. Frontend — API Call Patterns

### Dùng wrapper từ api/client.ts

```ts
// api/generate.ts
import { apiFetch, apiJson } from './client';

// GET → apiJson (auto parse JSON)
export async function listHistory() {
  return apiJson('/history');
}

// POST with FormData → apiFetch
export async function generateSpeech(formData: FormData) {
  return apiFetch('/generate', { method: 'POST', body: formData });
}
```

### Error handling

```jsx
// Trong hooks: try/catch + toast
try {
  const response = await generateSpeech(formData);
  // ...
} catch (err) {
  toast.error("Error: " + err.message);
}
```

---

## 9. Frontend — Error Handling

| Tình huống | Cách xử lý |
|---|---|
| API error | `toast.error(err.message)` — hiện toast cho user |
| Expected error (validation) | `toast.error("Please enter text")` — thông báo rõ ràng |
| Unexpected error | `console.error()` + toast fallback |
| Component crash | Bọc `<ErrorBoundary name="xxx">` |
| Async operation | `try/catch` trong hook, không để uncaught Promise |

---

## 10. Backend — Python Patterns

### Router Pattern

```python
# api/routers/generation.py
from fastapi import APIRouter, Form, File, UploadFile
router = APIRouter()

@router.post("/generate")
async def generate_speech(
    text: str = Form(...),
    num_step: int = Form(16),
    profile_id: Optional[str] = Form(None),
):
    ...
```

### Logging

```python
import logging
logger = logging.getLogger("omnivoice.generate")

logger.info("...")     # flow chính
logger.error("...")    # lỗi
logger.debug("...")    # chi tiết debug
logger.exception("...") # kèm traceback
```

### DB Access

```python
from core.db import db_conn

with db_conn() as conn:
    rows = conn.execute("SELECT * FROM generation_history ...").fetchall()
```

### Error Response

```python
from fastapi import HTTPException

raise HTTPException(status_code=400, detail="Invalid parameter")
raise HTTPException(status_code=500, detail=f"Error: {e}")
```

---

## 11. Quy tắc chung cho AI Agent

### ✅ PHẢI làm

- **Giữ nguyên comments và docstrings** không liên quan đến thay đổi
- **Dùng patterns đã có** — không phát minh patterns mới
- **Feature flag** cho tính năng mới có thể ảnh hưởng UI cũ
- **Import từ barrel files** (`../ui`, `../store`, `./client`)
- **Test build** sau khi sửa frontend: `cd frontend && bun run build`
- **Commit nhỏ** — mỗi commit 1 feature rõ ràng
- **Cập nhật dev-history** sau mỗi phiên coding có thay đổi code:
  - Tạo file `docs/dev-history/YYYY-MM-DD_<loại>_<mô-tả-ngắn>.md` (xem mẫu trong thư mục)
  - Cập nhật bảng trong `docs/dev-history/README.md`
  - Ghi rõ: triệu chứng, root cause, fix, gotchas cho developer/agent sau

### ❌ KHÔNG làm

- Không dùng class / OOP (trừ extends Error)
- Không tạo file `.css` module — dùng global CSS với prefix
- Không hardcode màu — dùng CSS variables
- Không import trực tiếp từ `ui/Button.jsx` — dùng `../ui`
- Không tạo store mới — thêm slice vào store hiện tại
- Không chạy lệnh xóa (`rm`, `rm -rf`) trên file lớn / model
- Không cài daemon / service hệ thống mà chưa được phê duyệt
- Không sửa `pyproject.toml` dependencies mà chưa hỏi

### ⚠️ Cẩn thận

- **localStorage**: Zustand persist sẽ giữ giá trị cũ. Khi đổi default → cần bump `version` trong store hoặc hướng dẫn user clear.
- **DB migration**: Thêm cột → phải nullable hoặc có default. Dùng `IF NOT EXISTS` pattern.
- **CORS**: Web mode cần `OMNIVOICE_LAN_MODE=1` để mở CORS cho LAN clients.
- **Tauri vs Web**: Kiểm tra `isTauri` flag trước khi gọi `@tauri-apps/*` APIs.

---

## 12. File Structure khi thêm feature mới

```
Ví dụ: thêm "Clone Preset" feature

frontend/src/
├── config/
│   └── clone-presets.json          ← [NEW] Static config
├── hooks/
│   └── useCloneMode.js             ← [NEW] Custom hook
├── api/
│   └── transcribe.ts               ← [NEW] API wrapper
├── pages/
│   └── CloneDesignTab.jsx           ← [MODIFY] Thêm preset dropdown
├── components/
│   ├── Header.jsx                   ← [MODIFY] isCloneMode guard
│   ├── NavRail.jsx                  ← [MODIFY] Filter tabs
│   └── Sidebar.jsx                  ← [MODIFY] Filter tabs
├── store/
│   └── (KHÔNG tạo file mới — thêm vào slice hiện có)
└── App.jsx                          ← [MODIFY] Wire up isCloneMode
```