# 🔧 Fix: AudioTrimmer Preview Selection + Refactor + Features mới

| Field | Value |
|-------|-------|
| **Ngày** | 2026-06-01 |
| **Loại** | Bug Fix + Refactor + Feature |
| **Severity** | Medium — Preview không hoạt động khi import audio mới |
| **Môi trường** | Web browser (cả localhost và LAN) |
| **File thay đổi** | `frontend/src/components/AudioTrimmer.jsx` |

---

## 1. Bug Fix: Preview Selection không hoạt động

### Triệu chứng
Sau khi import audio mới vào Trim dialog, bấm "Preview Selection" không phát âm thanh. Console báo `No audio source available`.

### Root Cause
Race condition giữa React effect cleanup và togglePlay:

1. Khi `file` prop đổi → cleanup effect cũ chạy: `a.removeAttribute('src')` + `URL.revokeObjectURL(url)`
2. Effect mới chạy: tạo objectURL mới, set `a.src = url`
3. Nhưng nếu user bấm Preview ngay lập tức, `a.src` có thể rỗng hoặc `a.readyState = 0`
4. Code cũ check `a.readyState >= 1` → false → addEventListener `loadedmetadata` → nhưng event đã fire trước khi listener gắn → **doPlay không bao giờ được gọi**

### Fix
1. Thêm `audioUrlRef` để lưu objectURL, không phụ thuộc vào `a.src`
2. Đổi threshold từ `readyState >= 1` sang `>= 2` (HAVE_CURRENT_DATA)
3. Lắng nghe `canplay` thay vì `loadedmetadata` (fire muộn hơn, đáng tin hơn)
4. Re-apply `a.src` từ `audioUrlRef` nếu bị mất do cleanup race

---

## 2. Refactor: Tách `playRegion(start, end)` thành hàm độc lập

### Vấn đề cũ
`togglePlay()` vừa đọc state, vừa xử lý audio loading, vừa enforce boundary — tất cả dính chặt vào `stateRef.current` (dễ bị React batch update race).

### Kiến trúc mới

```
commitStartInput() → trả về giá trị start mới nhất
commitEndInput()   → trả về giá trị end mới nhất
        ↓
togglePlay()       → gọi commit, lấy s/e, gọi playRegion(s, e)
        ↓
playRegion(s, e)   → lưu vào playBoundaryRef, xử lý audio loading + play
        ↓
enforceBoundary()  → đọc playBoundaryRef (KHÔNG phải stateRef) để dừng/loop
```

**Refs mới:**
- `playBoundaryRef` — lưu `{ start, end }` của vùng đang phát thực tế
- Phân tách rõ "vùng đang chọn" (stateRef) vs "vùng đang phát" (playBoundaryRef)

---

## 3. Feature: Waveform đổi màu vùng đã phát

**Marker**: `// [FEATURE: played-region] START/END`

Khi đang play, nét vẽ waveform trong vùng từ `start → A'` (vị trí phát hiện tại) chuyển sang **màu vàng gold** (`#fabd2f`), phần `A' → end` giữ nguyên **màu hồng** (`#d3869b`).

- Dùng `audioRef.current.currentTime` (thời gian phát thực tế) thay vì `cursor` (vị trí chuột) để tránh lỗi đổi màu theo hover.
- Màu được thay trực tiếp trong loop vẽ waveform (fillStyle per-pixel), không phải overlay.

**Rollback**: Xóa block giữa 2 comment marker, đổi `ctx.fillStyle` về `'#d3869b'` cố định.

---

## 4. Feature: Double-click waveform = Seek + Auto-play

**Marker**: `// [FEATURE: click-to-play] START/END`

- Double-click bất kỳ vị trí nào trên waveform → xóa vùng chọn cũ (A=B=điểm click) + auto-play từ đó đến hết file.
- `playRegion()` tự nhận biết vùng chọn quá nhỏ (`e - s < 0.1`) → bypass boundary → play tới hết file.
- Single-click giữ nguyên logic cũ (tạo selection mới).

**Rollback**:
1. Xóa block giữa 2 comment marker
2. Bỏ `onDoubleClick={onCanvasDblClick}` khỏi `<canvas>`

---

## 5. Feature: Timecode Input (DAW-style)

### Hiển thị
- Ô input Start/End hiện timecode chuẩn `mm:ss.cs` (ví dụ `01:05.50`)
- Trên 1 giờ → `hh:mm:ss.cs`

### Parser (`parseTimecode()`)
Chấp nhận mọi định dạng đầu vào:

| Input | Kết quả (giây) | Hiển thị |
|-------|-----------------|----------|
| `65.5` | 65.5 | `01:05.50` |
| `1:05.5` | 65.5 | `01:05.50` |
| `0:1:05,50` | 65.5 | `01:05.50` |
| `5` | 5.0 | `00:05.00` |

- Hỗ trợ dấu phẩy (`,`) thay dấu chấm (`.`) cho locale EU
- `inputMode` đổi từ `decimal` sang `text` để bàn phím mobile hiện dấu `:`

---

## 6. Bug Fix: enforceBoundary không dừng ở End

### Triệu chứng
Bấm Preview Selection, audio phát từ Start nhưng không dừng ở End, chạy tới hết file.

### Root Cause
RAF loop tick (~60fps) đọc `stateRef.current.end` nhưng giá trị này bị React batch update delay — có thể stale.

### Fix
1. Thêm `timeupdate` event listener backup (browser gọi ~4x/sec, đáng tin hơn RAF khi tab bị throttle)
2. `enforceBoundary()` đọc từ `playBoundaryRef` (được set đồng bộ trong `playRegion()`) thay vì `stateRef`

---

## 7. Gotchas

- Mọi feature mới đều được wrap bằng `// [FEATURE: xxx] START/END` — grep để tìm và rollback
- `audioUrlRef` là dependency chung cho cả bug fix và click-to-play — nếu rollback click-to-play, **giữ lại** `audioUrlRef`
- `playBoundaryRef` là dependency chung cho cả refactor và enforceBoundary — nếu rollback, cần revert về đọc `stateRef.current`
- `parseTimecode()` và `fmtHMS()` là hàm pure, an toàn để tái sử dụng ở component khác
