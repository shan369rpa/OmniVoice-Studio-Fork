# 🔧 Multi-fix: LAN Clone Mode — CORS, Loopback, API URL, Auto-Transcribe

| Field | Value |
|-------|-------|
| **Ngày** | 2026-05-28 |
| **Loại** | Bug Fix + Feature |
| **Severity** | High — app clone mode không hoạt động trên máy khách LAN |
| **Môi trường** | Web browser, LAN clients (192.168.1.x) truy cập `http://192.168.1.27:3900/?mode=clone` |
| **File thay đổi** | `frontend/src/api/client.ts`, `backend/api/dependencies.py`, `backend/main.py`, `frontend/src/hooks/useTTS.js` |

---

## 1. Triệu chứng

Máy khách LAN truy cập `http://192.168.1.27:3900/?mode=clone`:
- **Lỗi 1**: Trang load được nhưng mọi API call fail với `ERR_CONNECTION_REFUSED`
- **Lỗi 2**: Sau fix lỗi 1, tất cả API trả `403 Forbidden`
- **Lỗi 3**: Sau fix CORS, endpoints `/model/status`, `/sysinfo` vẫn `403` với body `{"detail": "loopback origin required"}`
- **Lỗi 4**: Chức năng auto-transcribe chỉ chạy lần đầu, không chạy khi chọn audio mới

---

## 2. Root Cause & Fix

### 2.1 API URL hardcode localhost

**Vấn đề**: `frontend/src/api/client.ts` hardcode `http://127.0.0.1:3900`. Máy khách fetch trang web qua LAN IP OK, nhưng JS gọi API về `127.0.0.1` = localhost của chính máy khách → không có server.

**Fix**:
```diff
- export const API = viteEnv.VITE_API_URL || `http://127.0.0.1:${_port}`;
+ const _host = (typeof window !== 'undefined' && window.location.hostname) || '127.0.0.1';
+ export const API = viteEnv.VITE_API_URL || `http://${_host}:${_port}`;
```

**Bài học**: Khi app cần serve qua LAN, không hardcode localhost cho API calls. Dùng `window.location.hostname` để auto-detect.

---

### 2.2 CORS credentials + wildcard conflict

**Vấn đề**: `backend/main.py` khi `OMNIVOICE_LAN_MODE=1` set `allow_origins=["*"]` + `allow_credentials=True`. Theo W3C CORS spec, tổ hợp này **bị cấm** → trình duyệt trả 403.

**Fix**:
```diff
  app.add_middleware(
      CORSMiddleware,
      allow_origins=[o.strip() for o in _allowed if o.strip()],
-     allow_credentials=True,
+     allow_credentials=not _lan_mode,  # credentials + origins=* is forbidden by CORS spec
      allow_methods=["*"],
      allow_headers=["*"],
  )
```

**Bài học**: `Access-Control-Allow-Origin: *` + `Access-Control-Allow-Credentials: true` là tổ hợp **luôn bị trình duyệt block**. Khi dùng wildcard origin, phải tắt credentials.

---

### 2.3 Loopback guard chặn LAN clients

**Vấn đề**: `backend/api/dependencies.py` có hàm `require_loopback()` kiểm tra `request.client.host` — nếu không phải `127.0.0.1/::1/localhost` → 403. Guard này được dùng ở router level cho `system.py`, `engines.py`, `settings.py`.

**Fix**:
```diff
+ _lan_mode = os.environ.get("OMNIVOICE_LAN_MODE", "0").strip() == "1"

  def require_loopback(request: Request) -> None:
+     if _lan_mode:
+         return
      host = request.client.host if request.client else None
      if host not in _LOOPBACK_HOSTS:
          raise HTTPException(status_code=403, detail="loopback origin required")
```

**Bài học**: Khi thêm security guard (loopback, auth), luôn xem xét LAN mode bypass. Grep `require_loopback` để xem tất cả router bị ảnh hưởng.

---

### 2.4 Auto-transcribe chỉ chạy lần đầu

**Vấn đề**: `useTTS.js` — hàm `ingestRefAudio` có logic transcribe bên trong, nhưng khi audio dài > 15s, code `return` sớm ở nhánh trim → transcribe không chạy. Ngoài ra khi chọn audio mới, transcribe cũng không trigger lại.

**Fix**: Tách `autoTranscribe()` thành hàm riêng, export ra cho `App.jsx`. Gọi ở cả nhánh trim (sau khi trim xong) và nhánh bình thường.

```diff
+ const autoTranscribe = useCallback(async (file) => {
+   if (!file || !isCloneMode) return;
+   // transcribe logic...
+ }, [isCloneMode]);

  const ingestRefAudio = useCallback(async (file) => {
    ...
    if (dur && dur > CLONE_MAX_SECONDS) {
      setPendingTrimFile(file);
-     return;  // ← transcribe bị skip
+     return;  // trim dialog sẽ gọi autoTranscribe sau khi trim xong
    }
    setRefAudio(file);
+   autoTranscribe(file);
  }, [...]);
```

Trong `App.jsx`:
```diff
  onConfirm={(trimmed) => {
    setPendingTrimFile(null);
    setRefAudio(trimmed);
+   autoTranscribe(trimmed); // transcribe đoạn đã trim
    toast.success('Trimmed audio loaded');
  }}
```

---

## 3. Gotchas cho developer/agent sau

1. **Khi chạy LAN mode**, luôn start server với: `OMNIVOICE_BIND_HOST=0.0.0.0 OMNIVOICE_LAN_MODE=1`
2. **Port conflict**: Process cũ có thể giữ port dù bị kill — dùng `kill -9 $(lsof -ti :3900 -sTCP:LISTEN)` (chỉ kill LISTEN, không kill Chrome)
3. **Server chạy từ Antigravity background task** sẽ bị tắt khi agent restart. Dùng file `.command` trên Desktop để chạy độc lập
4. **Test CORS**: Dùng curl với header `Origin` + `X-Client-Id` để mô phỏng browser:
   ```bash
   curl -v http://192.168.1.27:3900/model/status \
     -H "Origin: http://192.168.1.22:0" \
     -H "X-Client-Id: test"
   ```
