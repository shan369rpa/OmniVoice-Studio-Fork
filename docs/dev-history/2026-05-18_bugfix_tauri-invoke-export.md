# 🐛 Bugfix: `Export failed: Cannot read properties of undefined (reading 'invoke')`

| Field | Value |
|-------|-------|
| **Ngày** | 2026-05-18 |
| **Loại** | Bug Fix |
| **Severity** | High — crash toàn bộ tính năng Export trong web dev mode |
| **Môi trường** | Web browser (`bun run dev`, port 3901) — KHÔNG xảy ra trong Tauri desktop app |
| **Commit base** | `2d0f0e7` (HEAD tại thời điểm fix) |
| **File thay đổi** | `frontend/src/App.jsx` |

---

## 1. Triệu chứng

User nhấn nút Export (icon download ⬇) trong **Sidebar → History tab**, nhận được toast lỗi:

```
Export failed: Cannot read properties of undefined (reading 'invoke')
```

Stack trace điển hình:
```
TypeError: Cannot read properties of undefined (reading 'invoke')
    at invoke (...)           ← bên trong @tauri-apps/plugin-dialog
    at save (...)
    at handleNativeExport (App.jsx:498)
    at onClick (Sidebar.jsx:393)
```

---

## 2. Root Cause phân tích

### 2.1 Call chain

```
Sidebar.jsx:393
  └─ onClick={() => handleNativeExport(e, item.audio_path, item.audio_path, item.mode)}

App.jsx:495  handleNativeExport()
  └─ const { save } = await import('@tauri-apps/plugin-dialog')  ← ⚠️ không có isTauri guard
       └─ save()
            └─ [plugin nội bộ] window.__TAURI__.core.invoke(...)
                                         ↑
                                  undefined trong browser!
```

### 2.2 Tại sao xảy ra

`@tauri-apps/plugin-dialog` là một npm package bình thường — **import thành công** trong mọi môi trường (kể cả browser). Tuy nhiên khi `save()` được gọi, plugin internally thực hiện:

```js
// Bên trong plugin-dialog (simplified)
window.__TAURI__.core.invoke('plugin:dialog|save', params)
//      ↑ object này chỉ tồn tại trong Tauri WebView
//        Trong browser: window.__TAURI__ = undefined
//        → TypeError: Cannot read properties of undefined (reading 'invoke')
```

### 2.3 Tại sao lỗi này dễ bị bỏ sót

- Mọi Tauri-specific call khác trong codebase đều được guard bằng `isTauri` (từ `utils/media.js`)
- Riêng `handleNativeExport` thiếu guard này — có thể bị bỏ sót khi refactor vì function có try/catch tưởng sẽ bắt được lỗi, nhưng lỗi xảy ra bên trong async import sau đó

### 2.4 Tại sao try/catch không bắt được trong một số trường hợp

Lỗi xảy ra **đồng bộ** bên trong `save()` của plugin trước khi Promise được tạo, nên không phải lúc nào try/catch bên ngoài cũng kịp bắt (tùy phiên bản plugin).

---

## 3. Fix

**File**: `frontend/src/App.jsx`  
**Dòng**: 495–520 (function `handleNativeExport`)

### Code trước fix
```js
const handleNativeExport = async (e, sourceIdentifier, fallbackName, mode) => {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');  // ← không guard isTauri
    const ext = fallbackName.includes('.') ? fallbackName.split('.').pop() : 'wav';
    const destPath = await save({ defaultPath: fallbackName, filters: [{ name: 'Media', extensions: [ext] }] });
    if (!destPath) return;

    await exportAction({ source_filename: sourceIdentifier, destination_path: destPath, mode });
    toast.success(`Exported: ${fallbackName}`);
    loadExportHistory();
  } catch (err) {
    console.error(err);
    toast.error(`Export failed: ${err?.message || err}`);
  }
};
```

### Code sau fix
```js
const handleNativeExport = async (e, sourceIdentifier, fallbackName, mode) => {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  // In Tauri desktop app: use native save dialog (plugin-dialog → invoke).
  // In browser/web dev mode: fall back to standard blob download so
  // @tauri-apps/plugin-dialog never tries to call window.__TAURI__.core.invoke
  // (which is undefined outside the desktop shell) and throws the error:
  // "Cannot read properties of undefined (reading 'invoke')".
  if (!isTauri) {
    const url = `${API}/audio/${sourceIdentifier}`;
    triggerDownload(url, fallbackName || sourceIdentifier);
    return;
  }
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const ext = fallbackName.includes('.') ? fallbackName.split('.').pop() : 'wav';
    const destPath = await save({ defaultPath: fallbackName, filters: [{ name: 'Media', extensions: [ext] }] });
    if (!destPath) return;

    await exportAction({ source_filename: sourceIdentifier, destination_path: destPath, mode });
    toast.success(`Exported: ${fallbackName}`);
    loadExportHistory();
  } catch (err) {
    console.error(err);
    toast.error(`Export failed: ${err?.message || err}`);
  }
};
```

### Thay đổi logic

| Môi trường | Trước fix | Sau fix |
|------------|-----------|---------|
| **Tauri desktop app** | Native save dialog ✅ | Native save dialog ✅ (không đổi) |
| **Web browser (`bun run dev`)** | Crash 💥 | Blob download qua `triggerDownload` ✅ |

---

## 4. Variables quan trọng cần biết

### `isTauri` — nguồn gốc

Được định nghĩa tại `frontend/src/utils/media.js`:

```js
const isTauri = typeof window !== 'undefined' && !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
```

- `true` chỉ khi chạy bên trong Tauri WebView (desktop app)
- `false` khi chạy trong browser thường (`bun run dev`, Chrome, Safari...)
- Export: `export { isTauri };`
- Import trong App.jsx dòng 58: `import { isTauri, ... } from './utils/media';`

### `triggerDownload` — fallback browser download

Hàm tại `App.jsx` dòng ~526. Tự động detect `isTauri`:
- Nếu `isTauri` → dùng native save dialog (khác với `handleNativeExport` là không cần source file trên server)
- Nếu browser → blob download thông thường qua `<a>` element

---

## 5. Kiến trúc Pattern: Tauri vs Browser

### ⚠️ Anti-pattern cần tránh

```js
// ❌ SAI — luôn import plugin dù không ở trong Tauri
const { save } = await import('@tauri-apps/plugin-dialog');
await save(...);  // crash trong browser
```

### ✅ Pattern đúng

```js
// ✅ ĐÚNG — guard bằng isTauri trước
if (!isTauri) {
  // fallback cho browser
  return;
}
const { save } = await import('@tauri-apps/plugin-dialog');
await save(...);
```

### Các Tauri plugins cần guard `isTauri`:

| Plugin | Dùng khi | Fallback |
|--------|----------|---------|
| `@tauri-apps/plugin-dialog` | `save()`, `open()`, `confirm()`, `ask()` | `window.confirm()`, blob download |
| `@tauri-apps/plugin-opener` | `openUrl()` | `window.open()` |
| `@tauri-apps/plugin-updater` | `check()` | skip |
| `@tauri-apps/plugin-process` | `relaunch()` | skip |
| `@tauri-apps/api/core` | `invoke()` | HTTP fallback |

> **Ngoại lệ**: `@tauri-apps/api/core` được handle qua `getInvoke()` trong `api/system.ts` — đã có fallback sẵn, không cần guard thủ công.

---

## 6. Files liên quan

```
frontend/src/App.jsx                  ← file được sửa
frontend/src/components/Sidebar.jsx   ← nơi gọi handleNativeExport (dòng 393)
frontend/src/utils/media.js           ← định nghĩa isTauri
frontend/src/utils/dialog.js          ← askConfirm() — đã có guard isTauri đúng cách
frontend/src/api/external.ts          ← openExternal() — đã có guard isTauri đúng cách
frontend/src/api/system.ts            ← invoke() — dùng getInvoke() pattern với fallback
```

---

## 7. Test cases để verify

| Scenario | Expected |
|----------|----------|
| Web dev mode + click Export history item | Blob download via browser (không crash) |
| Web dev mode + click Export history item | Toast "Processing..." rồi "Downloaded ..." |
| Tauri desktop + click Export history item | Native macOS "Save As" dialog mở ra |
| Tauri desktop + cancel save dialog | Không có toast, không có error |

---

## 8. Ghi chú thêm

### Tại sao không fix bằng cách thêm try/catch mạnh hơn?

Thêm try/catch rộng hơn không giải quyết UX — user sẽ thấy toast lỗi thay vì tải file được. Fix đúng là **cung cấp hành vi có ý nghĩa** cho mỗi môi trường, không phải chỉ suppress lỗi.

### Có thể tái phát ở đâu khác?

Kiểm tra nếu có thêm function nào trong codebase gọi các Tauri plugin mà không guard `isTauri`. Có thể tìm bằng:

```bash
grep -r "import('@tauri-apps/plugin-" frontend/src --include="*.jsx" --include="*.js" --include="*.ts" -n
```

Tất cả kết quả cần được guard bằng `isTauri` hoặc `'__TAURI_INTERNALS__' in window` trước khi gọi bất kỳ function nào từ plugin đó.
