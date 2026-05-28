# 🎬 Hướng Dẫn Chi Tiết: Dubbing (Lồng Tiếng) trên OmniVoice Studio

> **Phiên bản**: OmniVoice Studio v0.2.7  
> **Máy**: Mac Studio M2 Ultra · 192 GB RAM · macOS  
> **Ngày**: 18/05/2026

---

## Mục lục

1. [Dubbing là gì?](#1-dubbing-là-gì)
2. [Quy trình tổng quan](#2-quy-trình-tổng-quan)
3. [Bước 1 — Nạp video/audio](#3-bước-1--nạp-videoaudio)
4. [Bước 2 — Upload & Transcribe](#4-bước-2--upload--transcribe)
5. [Bước 3 — Chỉnh sửa segments](#5-bước-3--chỉnh-sửa-segments)
6. [Bước 4 — Dịch (Translate All)](#6-bước-4--dịch-translate-all)
7. [Bước 5 — Gán giọng (CAST)](#7-bước-5--gán-giọng-cast)
8. [Bước 6 — Generate Dub](#8-bước-6--generate-dub)
9. [Bước 7 — Export](#9-bước-7--export)
10. [Tính năng nâng cao](#10-tính-năng-nâng-cao)
11. [Mẹo & Troubleshooting](#11-mẹo--troubleshooting)
12. [Bảng tham chiếu nhanh](#12-bảng-tham-chiếu-nhanh)

---

## 1. Dubbing là gì?

**Dubbing** (lồng tiếng) là tính năng tự động thay thế giọng nói trong video/audio bằng giọng nói ngôn ngữ khác, đồng thời giữ nguyên nhạc nền và hiệu ứng âm thanh.

Pipeline đầy đủ:
```
Video/Audio gốc
    ↓
[Demucs] Tách vocals / nhạc nền
    ↓
[Whisper] Nhận diện giọng nói → Transcript (text + timestamps)
    ↓
[Translation Engine] Dịch từng đoạn sang ngôn ngữ đích
    ↓
[OmniVoice TTS] Tổng hợp giọng nói mới theo từng đoạn
    ↓
[FFmpeg] Ghép lại: nhạc nền + giọng dubbed → MP4/WAV/MP3
```

### So sánh với Voice Clone

| Tính năng | Voice Clone | Dubbing |
|-----------|-------------|---------|
| Input | Audio mẫu + text mới | Video/Audio có sẵn |
| Mục tiêu | Tạo giọng mới theo ý muốn | Dịch & lồng tiếng video |
| Bước thủ công | Nhập text | Kiểm tra/sửa transcript |
| Output | WAV (audio đơn) | MP4 + WAV + SRT/VTT |

---

## 2. Quy trình tổng quan

```
[Upload] → [Transcribe] → [Edit] → [Translate] → [Generate] → [Export]
   1s          1-5 phút      Tuỳ ý      ~30s           ~1-2 phút    Tuỳ chọn
```

Có thể **bỏ qua Translate** nếu chỉ muốn đổi giọng mà không đổi ngôn ngữ (re-voice).

---

## 3. Bước 1 — Nạp video/audio

### Cách 1: Kéo & thả (Drag & Drop)
Kéo file vào vùng drop zone lớn ở giữa màn hình.

**Định dạng hỗ trợ**:

| Loại | Định dạng |
|------|-----------|
| Video | MP4, MOV, MKV, WEBM |
| Audio | MP3, WAV, FLAC, M4A, OGG |

### Cách 2: Chọn file
Click vào drop zone → File picker mở ra.

### Cách 3: Dán URL (YouTube / video trực tuyến)
Nhập URL vào ô **"…or paste YouTube / video URL"** rồi nhấn **Ingest**.

> **Tùy chọn "Pull YouTube captions"**: Nếu bật checkbox này, hệ thống sẽ tải phụ đề gốc từ YouTube (hoặc auto-translation của YouTube) thay vì chạy Whisper ASR. Kết quả nhanh hơn nhiều và không tốn tài nguyên GPU.

---

## 4. Bước 2 — Upload & Transcribe

Sau khi chọn file, nhấn **✨ Upload & Transcribe**.

### Các giai đoạn xử lý (Pipeline)

| Giai đoạn | Thời gian ước tính | Mô tả |
|-----------|-------------------|-------|
| `download` | 5–30s | Tải video (nếu là URL) |
| `extract` | 5–20s | Trích xuất audio từ video |
| `demucs` | **1–10 phút** | Tách vocals/nhạc nền (AI) |
| `scene` | 5–15s | Phát hiện scene cut |
| `cached` | ~0s | ⚡ Dùng cache từ lần trước |

> ⚠️ **Demucs** là bước lâu nhất — tỷ lệ ~1:1 so với thời lượng video. Video 10 phút ≈ 10 phút xử lý. M2 Ultra sẽ nhanh hơn đáng kể so với CPU.

> ⚡ **Cache thông minh**: Lần thứ 2 upload cùng file → bỏ qua Demucs, tiết kiệm thời gian lớn.

Sau Demucs, **Whisper** chạy để nhận diện giọng nói:
- Transcript được chia thành các **segments** (đoạn) với timestamp chính xác
- Tự động phát hiện ngôn ngữ gốc
- Ước tính thời gian: ~1 phút Whisper / 3 phút audio (trên M2 Ultra)

### Nếu Whisper thất bại

Có 2 lựa chọn:
1. **Retry transcription** — chạy lại ASR mà không cần upload lại video
2. **Import .srt** — tải file phụ đề SRT của riêng bạn để bỏ qua Whisper hoàn toàn

> 💡 **Khi nào dùng Import .srt?** Khi bạn đã có transcript chính xác (ví dụ lấy từ video lecture gốc, hoặc tự viết), import SRT sẽ nhanh hơn và chính xác hơn ASR.

---

## 5. Bước 3 — Chỉnh sửa segments

Sau khi transcribe xong, giao diện hiển thị bảng segments hai cột:

```
[Cột trái: Video + Waveform Timeline]     [Cột phải: Bảng Segments]
┌─────────────────────────────┐           ┌────────────────────────────────┐
│  🎬 Video player            │           │ Time    │ Spkr │ Text    │ Voice│
│  ══════════════════════     │           │ 0:01–0:05│ Sp.1 │ Hello…  │ Def  │
│  [Waveform Timeline]        │           │ 0:05–0:10│ Sp.1 │ Today…  │ Def  │
└─────────────────────────────┘           └────────────────────────────────┘
```

### Thao tác trên từng segment

| Thao tác | Cách thực hiện |
|----------|----------------|
| **Sửa text** | Click trực tiếp vào ô text |
| **Nghe preview** | Nút ▶ bên phải row (chỉ sau khi generate) |
| **Direct generation** | Nút ⚡ — generate riêng segment đó |
| **Xoá segment** | Nút 🗑 |
| **Restore về gốc** | Nút ↺ |
| **Split** | Chọn vị trí trong text → Nút Split |
| **Merge** | Chọn 2+ segments → Nút Merge |

### Bulk selection

- **Chọn nhiều**: Checkbox bên trái mỗi row
- **Chọn tất cả**: Checkbox header
- **Xóa hàng loạt**: "Delete selected"
- **Áp dụng voice**: "Apply voice to selected"

### Nút "Clean Up"

Tự động:
- Merge các segment quá ngắn (<0.5s) vào segment kề
- Merge các đoạn liền tiếp của cùng speaker nếu khoảng lặng < 0.3s
- Hữu ích sau khi Whisper chia quá chi tiết

---

## 6. Bước 4 — Dịch (Translate All)

### Cài đặt dịch thuật

Click vào thanh **settings summary** (dòng show ngôn ngữ + engine hiện tại) để mở:

| Setting | Mô tả |
|---------|-------|
| **Language** | Ngôn ngữ đích (ví dụ: Vietnamese, Japanese...) |
| **ISO Code** | Mã ngôn ngữ chính xác (vi, ja, de...) — ảnh hưởng voice generation |
| **Engine** | Công cụ dịch (xem bảng dưới) |
| **Quality** | Fast hoặc Cinematic |
| **Style** | Hướng dẫn phong cách dịch (optional) |
| **Multi-lang** | Dịch sang nhiều ngôn ngữ cùng lúc |

### Các Translation Engine

| Engine | Loại | Ưu điểm | Nhược điểm |
|--------|------|---------|------------|
| **Argos** | Local AI | Nhanh, offline, miễn phí | Chất lượng trung bình |
| **NLLB** | Local AI (Meta) | Tốt hơn Argos, 200 ngôn ngữ | Cần RAM nhiều hơn |
| **Google** | Online | Chất lượng tốt | Cần internet + API key |
| **OpenAI** | LLM online | Tốt nhất, hiểu ngữ cảnh | Tốn token, cần API key |

> **Cài thêm engine**: Nếu engine chưa được cài, nút **"+ install [package]"** xuất hiện cạnh Engine label → click để cài tự động.

### Quality Mode

| Mode | Mô tả | Thời gian |
|------|-------|-----------|
| **Fast** | Dịch một lần, thẳng | ~5–15s |
| **Cinematic** | 3 bước: translate → reflect → adapt (cần LLM) | ~30–60s |

> 💡 **Cinematic** dùng phương pháp "translation → self-reflection → adaptation" — LLM tự đánh giá và cải thiện bản dịch. Phù hợp cho nội dung quan trọng.

### Style (Phong cách dịch)

Trường **Style** truyền instruction cho translation engine. Ví dụ:
- `"formal, academic"` — dịch học thuật, trang trọng
- `"casual, friendly"` — dịch thân mật
- `"female narrator"` — giả định narrator nữ
- `"keep technical terms in English"` — giữ thuật ngữ tiếng Anh

### Restore & Re-translate

- Nút **↺ Restore** — đặt lại text về transcript gốc (bỏ bản dịch)
- Nút **Re-translate** — dịch lại toàn bộ (ghi đè bản dịch cũ)

---

## 7. Bước 5 — Gán giọng (CAST)

**CAST** là tính năng gán voice profile cho từng speaker được phát hiện trong video.

### Khi nào CAST xuất hiện?

Chỉ hiện khi Whisper phát hiện **nhiều hơn 1 speaker** (speaker diarization).

```
CAST   Speaker 1: [Default      ▾]
       Speaker 2: [🎤 From video (8.2s) ▾]
       Speaker 3: [Nguyễn Văn A  ▾]
```

### Các lựa chọn voice

| Option | Mô tả |
|--------|-------|
| **Default** | Dùng giọng OmniVoice mặc định (generic) |
| **🎤 From video · Xs** | Auto-clone giọng speaker từ chính video (nếu có ≥5s vocals được tách) |
| **Clone Profiles** | Các Voice Profile đã lưu sẵn trong ứng dụng |
| **Design Presets** | Các Voice Design preset có sẵn |

> 💡 **Auto-clone từ video** là tính năng mạnh nhất — tự động trích xuất giọng từng người trong video rồi dùng làm voice mẫu. Kết quả: giọng dubbed giống với giọng gốc của từng người.

---

## 8. Bước 6 — Generate Dub

Nhấn **▶ Generate Dub** để bắt đầu tổng hợp giọng cho toàn bộ segments.

### Progress tracking

```
Dubbing 12/45…
⏱ 1m 23s elapsed  ~3m remaining
████████░░░░░░░░░░░░ 26%
Generating segment 12: "Hôm nay chúng ta sẽ..."
```

### Incremental Regeneration

Sau khi generate lần đầu, nếu bạn sửa một số segments:
- Badge hiển thị: **"N segments changed since last generate"**
- Nút **"Regen N changed"** xuất hiện — chỉ generate lại đúng những segment đã sửa
- Tiết kiệm thời gian đáng kể cho video dài

### Dừng giữa chừng

Nút **⏹ Stop** — dừng sau khi segment hiện tại hoàn thành.  
Kết quả đã generate được giữ lại, có thể export một phần.

### Output Options (Trước khi Export)

| Option | Mô tả |
|--------|-------|
| **Mix BG Audio** | Trộn nhạc nền/âm thanh phòng vào giọng dubbed |
| **Dual subtitles** | Phụ đề song ngữ: bản dịch + bản gốc in nghiêng |
| **Burn subtitles** | Ghi phụ đề cứng (hardsub) vào video stream |
| **Default Track** | Track audio nào phát mặc định khi mở video |
| **Export Tracks** | Chọn track nào được đưa vào file xuất |

---

## 9. Bước 7 — Export

Nhấn **Export…** để mở Export Modal với 4 tab:

### Tab Video 🎬

Xuất file **MP4** với đầy đủ video + audio tracks.

| Setting | Mô tả |
|---------|-------|
| Container | MP4 (H.264) |
| Default audio track | Track nào phát mặc định |
| Background audio | Mix nhạc nền vào mọi track dubbed |
| Burn subtitles | Hardsub + tùy chọn dual |

> **Burn subtitles** sẽ **re-encode** video stream (chậm hơn). Không burn → stream copy (nhanh, không mất chất lượng).

### Tab Audio 🔊

Xuất **WAV hoặc MP3** cho từng track dubbed.

| Setting | Mô tả |
|---------|-------|
| Format | WAV (lossless) hoặc MP3 (compressed) |
| Bitrate (MP3) | 128k / 192k / 256k / 320k |
| What to export | Mỗi ngôn ngữ file riêng, hoặc chỉ một ngôn ngữ |
| Background audio | Mix nhạc nền |

### Tab Subtitles 📄

Xuất file phụ đề.

| Setting | Mô tả |
|---------|-------|
| Format | SRT, VTT, hoặc cả hai |
| Layout | Single line hoặc Dual (dịch + gốc) |
| Languages | Chỉ ngôn ngữ hiện tại, hoặc tất cả tracks đã dịch |

### Tab Package 📦

| Option | Output |
|--------|--------|
| **Per-segment clips (.zip)** | Từng segment được lồng tiếng → file WAV đánh số |
| **Stems (.zip)** | `vocals_dubbed_[lang].wav` + `background_original.wav` |

> 💡 **Stems** hữu ích cho post-production: nhập vào DAW (Logic, Audition) để mix thủ công.

### Presets Export nhanh

| Preset | Dùng khi |
|--------|---------|
| **YouTube** | Upload lên YouTube (MP4 với original audio làm default) |
| **Archive** | Lưu trữ đầy đủ (tất cả tracks) |
| **Web** | Web hosting (MP4 + hardsub) |
| **Podcast** | Chỉ audio MP3 192k |
| **Study set** | SRT dual language |

---

## 10. Tính năng nâng cao

### Multi-language Dubbing

Bật **Multi-lang** trong Settings → chọn nhiều ngôn ngữ đích cùng lúc.

```
[✓] Vietnamese  [✓] Japanese  [✓] French  [ ] Spanish
```

Hệ thống sẽ generate một lần nhưng tạo ra nhiều audio tracks:
- File MP4 xuất với đầy đủ tất cả tracks
- Viewer chọn ngôn ngữ qua audio track picker của player

### Lưu Project

**⌘+S** hoặc nút **Save** — lưu toàn bộ trạng thái (segments, translations, settings).

- Tự động đặt tên theo tên file video
- Load lại từ **Sidebar → Projects tab**
- Sau khi load, nút "Regen N changed" sẽ biết đúng những segment nào cần generate lại

### Checkpoint Banner (Review Mode)

Khi **Review Mode = ON** (Settings), hệ thống hiển thị banner nhắc nhở giữa các bước:
- Sau Transcribe → "Hãy kiểm tra transcript trước khi dịch"
- Sau Translate → "Hãy xem lại bản dịch trước khi generate"
- Sau Generate → "Lồng tiếng hoàn tất!"

### Glossary (Từ điển thuật ngữ)

Panel **Glossary** cho phép định nghĩa từ cụ thể → translation engine sẽ nhất quán dịch theo.

Ví dụ:
```
"Mindfulness" → "Chánh Niệm"
"Dharma"      → "Pháp"
"Sangha"      → "Tăng Đoàn"
```

Hữu ích cho nội dung chuyên ngành, tên riêng, thuật ngữ đặc thù.

---

## 11. Mẹo & Troubleshooting

### ⚡ Tăng tốc workflow

| Vấn đề | Giải pháp |
|--------|-----------|
| Demucs lâu | Dùng lại cache (lần 2 tự động nhanh hơn) |
| Whisper sai nhiều | Import .srt tự viết / chỉnh sửa thủ công |
| Dịch kém | Đổi sang OpenAI engine + Cinematic quality |
| Generate chậm | Dùng Incremental Regen thay vì generate full |
| Nhiều speaker | Assign đúng voice cho từng speaker trong CAST |

### ❗ Lỗi thường gặp

**"No dubbed tracks generated yet"**  
→ Chưa nhấn Generate Dub hoặc quá trình generate thất bại. Kiểm tra logs.

**"ffmpeg mux failed"**  
→ Thiếu ffmpeg. Cài: `brew install ffmpeg`

**"Demucs produced no output"**  
→ File video bị corrupt hoặc audio track bị mất. Thử convert trước bằng ffmpeg:
```bash
ffmpeg -i input.mp4 -c:v copy -c:a aac output_fixed.mp4
```

**Speaker diarization không chính xác**  
→ Chỉnh sửa thủ công cột "Spkr" trong bảng segments.

**Giọng dubbed không đồng bộ với video**  
→ Kiểm tra timestamps segment, dùng "Clean Up" để merge đoạn quá ngắn.

### 🎯 Tips cho chất lượng tốt nhất

1. **Video chất lượng cao** — tránh video có nhiều tiếng ồn nền → Demucs tách tốt hơn
2. **Transcript chính xác** — sửa lỗi Whisper trước khi dịch
3. **Segment length** — không quá 15 giây, không dưới 1 giây
4. **Style instruction** — thêm "same formal register as original" cho giọng nhất quán
5. **CAST auto-clone** — luôn ưu tiên option "🎤 From video" nếu có ≥5s vocals

---

## 12. Bảng tham chiếu nhanh

### Keyboard shortcuts

| Phím | Chức năng |
|------|-----------|
| `⌘+S` | Lưu project |
| `⌘+Enter` | Generate dub (khi đang ở bước editing) |
| `⌘+Z` | Undo |
| `⌘+Shift+Z` | Redo |

### API endpoints Dubbing

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `POST` | `/dub/upload` | Upload file video |
| `POST` | `/dub/ingest-url` | Nạp qua URL |
| `POST` | `/dub/transcribe/{id}` | Chạy ASR (Whisper) |
| `POST` | `/dub/translate/{id}` | Dịch segments |
| `POST` | `/dub/generate/{id}` | Generate dubbed audio |
| `GET` | `/dub/download/{id}` | Download MP4 |
| `GET` | `/dub/download-audio/{id}` | Download WAV |
| `GET` | `/dub/download-mp3/{id}` | Download MP3 |
| `GET` | `/dub/srt/{id}` | Download SRT |
| `GET` | `/dub/vtt/{id}` | Download VTT |
| `GET` | `/dub/export-stems/{id}` | Download stems .zip |
| `GET` | `/dub/export-segments/{id}` | Download segments .zip |
| `GET` | `/dub/tracks/{id}` | Danh sách tracks đã generate |
| `GET` | `/dub/preview-video/{id}` | Xem trước video dubbed |

### Thư mục lưu trữ

```
dub/
└── {job_id}/
    ├── video.mp4            ← Video gốc
    ├── audio.wav            ← Audio gốc (full)
    ├── vocals.wav           ← Chỉ giọng (Demucs)
    ├── no_vocals.wav        ← Nhạc nền (Demucs)
    ├── seg_0.wav            ← Segment dubbed #0
    ├── seg_1.wav            ← Segment dubbed #1
    └── exports/
        ├── dubbed_video_*.mp4
        ├── dubbed_audio_vi_*.wav
        └── dubbed_vi_*.mp3
```

---

## Tham khảo thêm

- [Voice Clone Guide](./huong-dan-voice-clone-vi.md) — tạo Voice Profile để dùng trong CAST
- [Voice Design Guide](./voice-design.md) — thiết kế giọng không cần audio mẫu
- [Generation Parameters](./generation-parameters.md) — tinh chỉnh TTS
- [API Docs](http://localhost:3900/docs) — Swagger UI đầy đủ
- [Dev History](./dev-history/README.md) — lịch sử thay đổi code
