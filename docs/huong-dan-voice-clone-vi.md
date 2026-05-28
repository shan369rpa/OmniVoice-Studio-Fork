# 🎙️ Hướng Dẫn Chi Tiết: Voice Clone trên OmniVoice Studio

> **Phiên bản**: OmniVoice Studio v0.2.7  
> **Máy**: Mac Studio M2 Ultra · 192 GB RAM · macOS  
> **Ngày**: 17/05/2026

---

## Mục lục

1. [Voice Clone là gì?](#1-voice-clone-là-gì)
2. [Chuẩn bị audio tham chiếu](#2-chuẩn-bị-audio-tham-chiếu)
3. [Sử dụng qua Web UI](#3-sử-dụng-qua-web-ui) ← *Emotion Tags chi tiết, ví dụ TNH*
4. [Voice Profile — Lưu & Quản lý giọng nói](#4-voice-profile--lưu--quản-lý-giọng-nói)
5. [Production Overrides — Tinh chỉnh nâng cao](#5-production-overrides--tinh-chỉnh-nâng-cao) ← *Giải thích sâu CFG/t_shift/PosTemp/LayerPen, Profile TNH*
6. [Sử dụng qua API (curl/Python)](#6-sử-dụng-qua-api)
7. [API tương thích OpenAI](#7-api-tương-thích-openai)
8. [Voice Design (không cần audio)](#8-voice-design-mode)
9. [Mẹo & Troubleshooting](#9-mẹo--troubleshooting)
10. [Bảng tham chiếu nhanh](#10-bảng-tham-chiếu-nhanh)

---

## 1. Voice Clone là gì?

**Voice Clone** (nhân bản giọng nói) là tính năng cốt lõi của OmniVoice Studio:

- **Zero-shot**: Chỉ cần **3 giây** audio mẫu → tái tạo giọng nói đó
- **646 ngôn ngữ**: Model tự phát hiện ngôn ngữ hoặc chọn thủ công
- **100% local**: Không upload dữ liệu lên cloud, xử lý hoàn toàn trên máy

### Luồng hoạt động

```
Audio tham chiếu (3-15s)     Văn bản cần đọc
         │                          │
         ▼                          ▼
┌──────────────────────────────────────┐
│       OmniVoice TTS Engine           │
│  (Diffusion Language Model · MPS)    │
└──────────────────────────────────────┘
                   │
                   ▼
         Audio đầu ra (.wav)
      Giọng nói giống audio mẫu
      Đọc nội dung văn bản mới
```

---

## 2. Chuẩn bị audio tham chiếu

### Yêu cầu kỹ thuật

| Tiêu chí | Khuyến nghị | Ghi chú |
|---|---|---|
| **Độ dài** | 3–15 giây | Tối ưu: 5-10s. Dưới 3s chất lượng giảm |
| **Định dạng** | WAV, MP3, M4A, FLAC, OGG, AAC, WebM | WAV cho chất lượng tốt nhất |
| **Sample rate** | ≥16 kHz | 24 kHz hoặc 44.1 kHz là lý tưởng |
| **Nội dung** | Nói rõ ràng, 1 người | Tránh nhiều người nói, nhạc nền |
| **Nhiễu** | Càng ít càng tốt | OmniVoice có bộ tiền xử lý tự động |

### Mẹo chuẩn bị audio tốt

```
✅ NÊN:
  • Thu trong phòng yên tĩnh
  • Nói tự nhiên, rõ ràng
  • Giữ 1 giọng ổn định xuyên suốt
  • Dùng mic cách miệng 15-30cm

❌ TRÁNH:
  • Audio có nhạc nền
  • Audio nhiều người nói lẫn
  • Audio bị clip/distortion
  • Đoạn quá ngắn (<2 giây)
```

### 3 cách lấy audio tham chiếu

1. **Upload file**: Kéo thả file audio vào vùng drop zone
2. **Thu trực tiếp**: Nhấn nút 🎤 **Record** trên giao diện
3. **Dùng Voice Profile**: Chọn từ danh sách đã lưu

---

## 3. Sử dụng qua Web UI

### Khởi động

```bash
cd /Users/sonpc/Documents/GitHub/OminiVoice
bun run dev
# Mở: http://localhost:3901
```

### Bước 1: Mở tab Voice Clone

Trên sidebar bên trái, chọn icon **🎙️ Voice Clone** (icon thứ 2 từ trên).  
Đảm bảo mode đang ở tab **"Clone"** (không phải "Design").

### Bước 2: Upload audio tham chiếu

**Cách A — Upload file:**
- Kéo thả file audio vào vùng `"Drop audio here — or click. WAV, MP3, M4A… 🎤"`
- Hoặc click vào vùng đó để mở file picker

**Cách B — Thu trực tiếp:**
- Nhấn nút **🎤 Record** ở bên phải drop zone
- Nói 5-10 giây
- Nhấn **⬛ Stop** để dừng thu
- App sẽ tự động làm sạch audio (hiển thị "Cleaning…")

### Bước 3: (Tuỳ chọn) Nhập Transcript & Style

| Trường | Mô tả | Ví dụ |
|---|---|---|
| **Transcript** | Nội dung đang nói trong audio tham chiếu | `"Xin chào, tôi là Sơn"` |
| **Style** | Hướng dẫn phong cách đọc | `"whisper"`, `"cheerful"`, `"sad"` |

> **Lưu ý**: Transcript giúp model alignment tốt hơn nhưng không bắt buộc. Nếu bỏ trống, model sẽ tự nhận diện.

### Bước 4: Viết văn bản cần đọc

Trong ô **Prompt** ở cột trái, nhập văn bản mà bạn muốn giọng clone đọc:

```
Hôm nay trời đẹp quá. Mình muốn đi dạo ngoài công viên và thưởng thức một ly cà phê.
```

**Emotion Tags** — chèn âm thanh phi ngôn ngữ (non-verbal) vào văn bản:

#### Bảng đầy đủ 13 Emotion Tags

| Tag | Nghĩa | Nhóm | Mô tả chi tiết |
|---|---|---|---|
| `[laughter]` | 😄 Cười | Tích cực | Tiếng cười tự nhiên, xen giữa hoặc cuối câu |
| `[sigh]` | 😮‍💨 Thở dài | Trung tính | Hơi thở dài — mệt, suy tư, hoặc nhẹ nhõm |
| `[confirmation-en]` | 🤔 Ừm hư | Đồng tình | Âm "uh-huh" / "mm-hmm" (đồng ý, lắng nghe) |
| `[question-en]` | ❓ Hả? | Thắc mắc | Âm nghi vấn kiểu tiếng Anh "huh?" |
| `[question-ah]` | ❓ À? | Thắc mắc | Nghi vấn nhẹ nhàng — "à?" |
| `[question-oh]` | ❓ Ồ? | Thắc mắc | Nghi vấn kèm ngạc nhiên — "oh?" |
| `[question-ei]` | ❓ Ê? | Thắc mắc | Nghi vấn kiểu Trung — "诶?" |
| `[question-yi]` | ❓ Ý? | Thắc mắc | Nghi vấn tinh tế — "嗯?" |
| `[surprise-ah]` | 😲 À! | Ngạc nhiên | Ngạc nhiên nhẹ — "ah!" |
| `[surprise-oh]` | 😲 Ồ! | Ngạc nhiên | Ngạc nhiên rõ — "oh!" |
| `[surprise-wa]` | 😲 Oa! | Ngạc nhiên | Ngạc nhiên mạnh — "wah!" |
| `[surprise-yo]` | 😲 Ô! | Ngạc nhiên | Ngạc nhiên kéo dài — "yo!" |
| `[dissatisfaction-hnn]` | 😤 Hmm | Bất mãn | Không hài lòng, khó chịu nhẹ |

#### Cách hoạt động kỹ thuật

Trong source code (`omnivoice.py` dòng 1510-1514), model nhận diện tags qua **regex cố định**:

```python
_NONVERBAL_PATTERN = re.compile(
    r"\[(laughter|sigh|confirmation-en|question-en|question-ah|..."
    r"|surprise-yo|dissatisfaction-hnn)\]"
)
```

Mỗi tag được **tokenize riêng biệt** (dòng 1517-1554) để đảm bảo cùng token ID bất kể ngôn ngữ xung quanh. Model đã được **huấn luyện** với chính xác 13 tags này trong training data.

#### `[CMU]` — Điều hướng phát âm bằng ARPAbet (Phonetic Tags)

Tag `[CMU]` cho phép bạn ghi đè cách đọc mặc định của model bằng cách cung cấp chuỗi phiên âm **ARPAbet** (thuộc hệ CMU Pronouncing Dictionary). 

**Cú pháp**: Đặt các âm vị (phonemes) viết hoa vào giữa cặp ngoặc vuông `[ ]`, ngăn cách bằng khoảng trắng. Các nguyên âm bắt buộc phải có số đánh dấu trọng âm (`0` = không trọng âm, `1` = trọng âm chính, `2` = trọng âm phụ).

**Ví dụ sử dụng:**
```text
Từ "base" phát âm chuẩn: [B EY1 S]
Từ "hello" phát âm chuẩn: [HH AH0 L OW1]
Từ "project" (Danh từ, nhấn âm 1): [P R AA1 JH EH0 K T]
Từ "project" (Động từ, nhấn âm 2): [P R AH0 JH EH1 K T]
Từ "AI" (Đọc từng chữ A - I): [EY1 AY1]
```

**Khi nào nên dùng?**
1. **Sửa lỗi tên riêng/thuật ngữ**: Khi model đọc sai hoặc lúng túng với một từ viết tắt, tên người, hoặc thuật ngữ kỹ thuật tiếng Anh.
2. **Chỉnh sửa trọng âm (Stress)**: Ép model đọc đúng ngữ điệu của từ (như phân biệt danh từ/động từ qua ví dụ "project").
3. **Kiểm soát cường độ**: Bạn có thể tuỳ biến các âm vị dài/ngắn, hoặc đổi nguyên âm để tạo ra âm vực đặc biệt (địa phương, nhấn mạnh cảm xúc).

> 💡 **Mẹo tra cứu**: Bạn có thể tìm mã ARPAbet chuẩn cho bất kỳ từ tiếng Anh nào tại [Từ điển CMU trực tuyến (CMUDict)](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) hoặc sử dụng các trang web chuyển đổi Text-to-ARPAbet.

#### Ví dụ sử dụng cho pháp thoại Thích Nhất Hạnh

```
[sigh] Thở vào, tôi biết tôi đang thở vào.
Thở ra, tôi mỉm cười. [confirmation-en]
An trú trong giây phút hiện tại,
tôi biết đây là giây phút tuyệt vời. [sigh]
```

> 💡 **Gợi ý cho TNH**: Chủ yếu dùng `[sigh]` (hơi thở chánh niệm) và `[confirmation-en]` (đồng tình nhẹ nhàng). **Tránh** dùng `[laughter]`, `[surprise-*]`, `[dissatisfaction-hnn]` — không phù hợp phong cách an tĩnh.

#### ❌ Có thể tự custom Emotion Tags không?

**Không thể tạo tag mới** — vì 3 lý do kỹ thuật:

1. **Hardcoded regex**: Danh sách 13 tags được cố định trong `_NONVERBAL_PATTERN` (dòng 1510). Tag ngoài danh sách sẽ bị tokenizer xử lý như text thường → model đọc nguyên cụm ký tự.

2. **Training data**: Model được huấn luyện với chính xác 13 non-verbal sounds này. Thêm `[meditation-bell]` hay `[mindful-pause]` sẽ không tạo ra âm thanh tương ứng.

3. **Token ID consistency**: Hàm `_tokenize_with_nonverbal_tags()` tách tags ra tokenize riêng để giữ token ID nhất quán — chỉ áp dụng cho 13 tags đã biết.

**Giải pháp thay thế** cho giọng thiền sư:
- Dùng `[sigh]` thay cho "khoảng lặng chánh niệm"
- Dùng tham số `Speed: 0.7` + `Postprocess: OFF` để giữ nhịp chậm tự nhiên
- Chèn dấu chấm `.` hoặc `...` giữa các câu để tạo khoảng nghỉ
- Dùng trường **Style**: `"male, elderly, low pitch"` để mô tả tổng thể

Ví dụ kết hợp:

```
[sigh] Hạnh phúc không phải là thứ có sẵn...
Nó đến từ những hành động của chính bạn. [confirmation-en]
[sigh] Khi bạn thở vào... hãy biết rằng bạn đang thở vào.
```

### Bước 5: Chọn ngôn ngữ & Steps

- **Language**: Chọn ngôn ngữ đầu ra (hoặc để `Auto` — tự nhận diện)
  - 646 ngôn ngữ có sẵn, searchable
- **Steps**: Số bước giải mã (mặc định: 16)
  - `8-16`: Nhanh, chất lượng khá
  - `32`: Cân bằng tốt nhất
  - `64`: Chất lượng cao nhất, chậm hơn

### Bước 6: Synthesize

Nhấn **▶ Synthesize Audio** — thanh progress sẽ hiển thị tiến trình.

Kết quả audio sẽ xuất hiện ngay trên giao diện. Bạn có thể:
- ▶️ Nghe thử
- 💾 Tải về (WAV)
- 🔄 Regenerate với seed khác

---

## 4. Voice Profile — Lưu & Quản lý giọng nói

Voice Profile cho phép **lưu lại audio tham chiếu** để tái sử dụng nhanh mà không cần upload lại.

### Tạo Profile mới

1. Upload audio tham chiếu (Bước 2 ở trên)
2. Nhấn **"Save as Voice Profile"** (hiện khi có audio)
3. Đặt tên, ví dụ: `"Thầy Nhất Hạnh"`, `"Giọng nữ Bắc"`
4. Nhấn **Save**

### Sử dụng Profile đã lưu

- Các profile hiển thị trong mục **"Saved Profiles"** ở cột phải
- Click vào tên profile → tự động load audio + settings
- Nhấn **✕ clear** để bỏ chọn và quay lại upload thủ công

### Lock Profile (khoá giọng)

Khi bạn tìm được kết quả clone ưng ý:
- Vào trang **Voice Profile** chi tiết
- Nhấn **Lock** kèm `history_id` và `seed`
- Profile sẽ dùng audio đã generate (thay vì audio gốc) → giọng ổn định hơn

### API quản lý Profile

```bash
# Liệt kê tất cả profiles
curl http://localhost:3900/profiles

# Tạo profile mới
curl -X POST http://localhost:3900/profiles \
  -F "name=Giọng mẫu" \
  -F "ref_audio=@voice_sample.wav" \
  -F "ref_text=Xin chào mọi người" \
  -F "language=vi"

# Xem chi tiết profile
curl http://localhost:3900/profiles/{profile_id}

# Nghe audio của profile
curl http://localhost:3900/profiles/{profile_id}/audio --output preview.wav

# Xem lịch sử sử dụng
curl http://localhost:3900/profiles/{profile_id}/usage
```

---

## 5. Production Overrides — Tinh chỉnh nâng cao

Mở rộng mục **"⚙️ Production Overrides"** để truy cập các tham số nâng cao.

### Bảng tham số

| Tham số | Mặc định | Phạm vi | Chức năng |
|---|---|---|---|
| **CFG** (Guidance Scale) | 2.0 | 1.0 – 4.0 | Độ bám sát hướng dẫn. Cao → giọng rõ hơn nhưng có thể kém tự nhiên |
| **Speed** | 1.0x | 0.5x – 2.0x | Tốc độ đọc. >1.0 nhanh hơn, <1.0 chậm hơn |
| **t_shift** | 0.1 | 0 – 1.0 | Dịch chuyển time-step noise. Nhỏ → nhấn mạnh bước đầu |
| **Pos Temp** | 5.0 | 0 – 10 | Nhiệt độ chọn vị trí mask. 0 = deterministic |
| **Class Temp** | 0.0 | 0 – 2.0 | Nhiệt độ sampling token. 0 = greedy |
| **Layer Pen** | 5.0 | 0 – 10 | Phạt lớp sâu, ưu tiên codebook thấp unmask trước |
| **Duration** | Auto | Số giây | Ép thời lượng đầu ra cố định |
| **Denoise** | ✅ On | On/Off | Thêm token `<|denoise|>` để giọng sạch hơn |
| **Postprocess** | ✅ On | On/Off | Xóa khoảng lặng dài trong output |

### 🔬 Giải thích chuyên sâu 4 tham số quan trọng

#### CFG — Classifier-Free Guidance Scale

**Bản chất**: CFG kiểm soát mức độ model "bám sát" vào audio tham chiếu (voice clone) hoặc instruct (voice design).

**Cách hoạt động trong code** (`omnivoice.py` dòng 1289-1293):
```python
# Model chạy 2 lần song song: có điều kiện (c) và không điều kiện (u)
log_probs = softmax(c_log_probs + CFG × (c_log_probs - u_log_probs))
```

- `CFG = 0`: Bỏ qua hoàn toàn audio tham chiếu → giọng ngẫu nhiên
- `CFG = 1.0`: Nhẹ nhàng, tự nhiên nhưng giọng có thể "trôi" xa mẫu gốc
- `CFG = 2.0` ⭐: Cân bằng tốt nhất — giọng giống mẫu + vẫn tự nhiên
- `CFG = 3.0-4.0`: Rất bám sát, nhưng giọng có thể bị "cứng", artifacts

> **Ví von**: Như lực hấp dẫn kéo giọng nói về phía audio mẫu. Nhẹ quá → trôi đi. Mạnh quá → bị "đông cứng".

#### t_shift — Time-step Shift (Noise Schedule)

**Bản chất**: Điều khiển cách model phân bổ "sức lực" qua các bước giải mã.

**Cách hoạt động** (`omnivoice.py` dòng 1505-1506):
```python
timesteps = linspace(0, 1, num_step)
timesteps = t_shift × timesteps / (1 + (t_shift - 1) × timesteps)
```

- `t_shift = 1.0`: Phân bổ đều → mỗi bước unmask cùng số token
- `t_shift = 0.1` ⭐ (mặc định): Dồn sức vào **bước đầu** → hình thành cấu trúc sớm, các bước sau tinh chỉnh chi tiết
- `t_shift → 0`: Cực kỳ tập trung bước đầu — phù hợp giọng rõ ràng, chậm rãi

> **Ví von**: Giống vẽ tranh. t_shift nhỏ = phác thảo toàn bộ trước rồi mới tô chi tiết. t_shift = 1 = vẽ từng góc một.

#### Pos Temp — Position Temperature

**Bản chất**: Kiểm soát **vị trí nào** trong chuỗi audio được unmask (giải mã) trước.

**Cách hoạt động** (`omnivoice.py` dòng 1268-1269):
```python
if position_temperature > 0:
    scores = gumbel_sample(scores, position_temperature)
    # → thêm nhiễu ngẫu nhiên vào điểm số vị trí
```

- `Pos Temp = 0`: Luôn unmask vị trí có **confidence cao nhất** trước (deterministic, ổn định)
- `Pos Temp = 5.0` ⭐: Thêm ngẫu nhiên vừa phải → giọng tự nhiên, linh hoạt
- `Pos Temp = 10`: Rất ngẫu nhiên → mỗi lần generate ra giọng khác nhau nhiều

> **Ví von**: Như thứ tự lắp ghép puzzle. Temp = 0 = luôn lắp miếng chắc chắn nhất. Temp cao = lắp ngẫu nhiên hơn, tạo sự đa dạng.

#### Layer Pen — Layer Penalty Factor

**Bản chất**: Kiểm soát **thứ tự unmask giữa 8 codebook layers**. OmniVoice dùng 8 lớp codec (layer 0-7), trong đó:
- **Layer 0-1**: Cấu trúc cơ bản (pitch, rhythm, phoneme) — trọng số cao nhất [8, 8]
- **Layer 6-7**: Chi tiết mịn (texture, breathiness) — trọng số thấp nhất [2, 2]

**Cách hoạt động** (`omnivoice.py` dòng 1266):
```python
scores = scores - (layer_ids × layer_penalty_factor)
# layer_ids: 0, 1, 2, 3, 4, 5, 6, 7
# → Layer 7 bị phạt 7 × 5.0 = 35 điểm!
```

- `Layer Pen = 0`: Unmask tất cả layers đồng thời — nhanh nhưng có thể lộn xộn
- `Layer Pen = 5.0` ⭐: Ưu tiên layer thấp trước → giọng cấu trúc tốt
- `Layer Pen = 10`: Cực kỳ tuần tự — phù hợp giọng cần độ rõ ràng cao

> **Ví von**: Như xây nhà. Layer Pen cao = đổ móng xong mới xây tường. Layer Pen = 0 = làm tất cả cùng lúc.

### 🧘 Gợi ý thiết lập cho Thiền sư Thích Nhất Hạnh

Dựa trên đặc điểm giọng nói đặc trưng của Thầy (trầm ấm, chậm rãi, an lành, có khoảng lặng chánh niệm giữa các câu):

```
🪷 Voice Clone — Thiền sư Thích Nhất Hạnh:
   Steps: 32-64    (chất lượng tối đa, không cần nhanh)
   CFG: 1.8-2.0    (bám giọng nhẹ nhàng, giữ sự tự nhiên)
   Speed: 0.7-0.8  (chậm rãi, chánh niệm — đặc trưng nhất)
   t_shift: 0.05   (dồn sức hình thành cấu trúc sớm → giọng rõ, ổn định)
   Pos Temp: 3.0    (ít ngẫu nhiên → giọng nhất quán)
   Class Temp: 0.0  (greedy → ổn định tối đa)
   Layer Pen: 7.0   (ưu tiên cấu trúc → giọng trầm rõ ràng)
   Denoise: On      (giọng sạch)
   Postprocess: OFF  (GIỮ khoảng lặng — đặc trưng pháp thoại)
```

**Style (trong UI):**
```
"male, elderly, low pitch"
```

> ⚠️ **Quan trọng**: Tắt **Postprocess** để giữ lại khoảng lặng tự nhiên — đây là đặc trưng quan trọng nhất trong pháp thoại của Thầy. Postprocess mặc định sẽ cắt bỏ khoảng lặng dài, làm mất hồn giọng thiền sư.

### Gợi ý thiết lập cho các use-case khác

```
🎤 Voice Clone chất lượng cao:
   Steps: 32 | CFG: 2.0 | Speed: 1.0 | Denoise: On

⚡ Voice Clone nhanh (draft):
   Steps: 8 | CFG: 1.5 | Speed: 1.2 | Denoise: On

📖 Đọc sách dài (audiobook):
   Steps: 32 | CFG: 2.5 | Speed: 0.9 | Duration: Auto

🎬 Dubbing video:
   Steps: 16 | CFG: 2.0 | Speed: 1.0 | Duration: [khớp segment]
```

### Long-Form Generation (văn bản dài)

Khi văn bản ước tính > 30 giây audio, model tự động chia thành chunk ~15 giây mỗi đoạn:

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `audio_chunk_duration` | 15.0s | Thời lượng mục tiêu mỗi chunk |
| `audio_chunk_threshold` | 30.0s | Ngưỡng kích hoạt chunking |

→ Cho phép generate audio dài tuỳ ý với VRAM gần như không đổi.

---

## 6. Sử dụng qua API

### Endpoint chính: `POST /generate`

```bash
# Voice clone cơ bản
curl -X POST http://localhost:3900/generate \
  -F "text=Hôm nay trời đẹp quá, mình muốn đi dạo" \
  -F "ref_audio=@my_voice.wav" \
  -F "language=vi" \
  -F "num_step=32" \
  --output output.wav

# Với transcript (chất lượng tốt hơn)
curl -X POST http://localhost:3900/generate \
  -F "text=Nội dung mới cần đọc" \
  -F "ref_audio=@my_voice.wav" \
  -F "ref_text=Nội dung đang nói trong audio mẫu" \
  -F "language=vi" \
  -F "num_step=32" \
  -F "guidance_scale=2.0" \
  --output output.wav

# Sử dụng voice profile đã lưu
curl -X POST http://localhost:3900/generate \
  -F "text=Xin chào các bạn" \
  -F "profile_id=abc12345" \
  -F "num_step=32" \
  --output output.wav

# Với style instruction
curl -X POST http://localhost:3900/generate \
  -F "text=Thật là buồn khi phải nói lời chia tay" \
  -F "ref_audio=@my_voice.wav" \
  -F "instruct=sad, slow" \
  -F "speed=0.8" \
  --output output.wav
```

### Response Headers

Mỗi response trả về các header hữu ích:

| Header | Ví dụ | Mô tả |
|---|---|---|
| `X-Audio-Id` | `a1b2c3d4` | ID duy nhất của audio |
| `X-Gen-Time` | `3.45` | Thời gian generate (giây) |
| `X-Audio-Path` | `a1b2c3d4.wav` | Tên file đã lưu |
| `X-Seed` | `42` | Seed sử dụng (để reproduce) |
| `X-Audio-Duration` | `5.67` | Thời lượng audio (giây) |

### Python SDK

```python
import requests

API = "http://localhost:3900"

# Clone giọng nói
with open("my_voice.wav", "rb") as f:
    resp = requests.post(f"{API}/generate", data={
        "text": "Xin chào, đây là giọng nói được nhân bản",
        "language": "vi",
        "num_step": 32,
        "guidance_scale": 2.0,
    }, files={
        "ref_audio": ("voice.wav", f, "audio/wav"),
    })

# Lưu kết quả
with open("output.wav", "wb") as f:
    f.write(resp.content)

print(f"⏱️ Thời gian: {resp.headers['X-Gen-Time']}s")
print(f"📏 Thời lượng: {resp.headers['X-Audio-Duration']}s")
print(f"🔑 Seed: {resp.headers.get('X-Seed', 'N/A')}")
```

### Lịch sử Generation

```bash
# Xem 50 lần generate gần nhất
curl http://localhost:3900/history

# Xoá một item
curl -X DELETE http://localhost:3900/history/{history_id}

# Xoá toàn bộ lịch sử
curl -X DELETE http://localhost:3900/history
```

---

## 7. API tương thích OpenAI

OmniVoice Studio cung cấp endpoint **drop-in replacement** cho OpenAI API, sử dụng được với Claude, Cursor, LangChain, litellm... mà **không cần sửa code**.

### Endpoint: `POST /v1/audio/speech`

```bash
# Cú pháp giống hệt OpenAI
curl -X POST http://localhost:3900/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "omnivoice",
    "input": "Xin chào, đây là OmniVoice Studio",
    "voice": "default",
    "response_format": "wav",
    "speed": 1.0
  }' \
  --output speech.wav

# Dùng voice profile
curl -X POST http://localhost:3900/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "omnivoice",
    "input": "Nội dung cần đọc",
    "voice": "abc12345",
    "language": "vi"
  }' \
  --output speech.wav
```

### Dùng với Python OpenAI SDK

```python
from openai import OpenAI

# Trỏ về OmniVoice local
client = OpenAI(
    base_url="http://localhost:3900/v1",
    api_key="not-needed"  # OmniVoice không cần key
)

# TTS
response = client.audio.speech.create(
    model="omnivoice",
    voice="default",
    input="Đây là ví dụ sử dụng OpenAI SDK với OmniVoice local"
)
response.stream_to_file("output.mp3")

# STT (Transcription)
with open("audio.wav", "rb") as f:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=f
    )
print(transcript.text)
```

### Models hỗ trợ

| Model ID | Mapping |
|---|---|
| `tts-1`, `tts-1-hd` | → Engine TTS đang active |
| `omnivoice` | → OmniVoice (600+ ngôn ngữ) |
| `mlx-audio` | → MLX-Audio (14+ engines, Apple Silicon) |
| `kittentts` | → KittenTTS (English, CPU realtime) |
| `whisper-1` | → Engine ASR đang active |

---

## 8. Voice Design Mode

> **Không cần audio tham chiếu** — mô tả bằng text, model tự tạo giọng nói phù hợp.

Chuyển sang tab **"Design"** trên giao diện.

### Cú pháp instruct

Viết bằng tiếng Anh hoặc tiếng Trung, phân cách bằng dấu phẩy:

```
"female, young adult, high pitch, british accent"
"male, elderly, low pitch, whisper"
"女，青年，高音调，四川话"
```

### Bảng thuộc tính hỗ trợ

| Loại | Giá trị |
|---|---|
| **Giới tính** | male, female |
| **Tuổi** | child, teenager, young adult, middle-aged, elderly |
| **Pitch** | very low/low/moderate/high/very high pitch |
| **Phong cách** | whisper |
| **Accent (tiếng Anh)** | american, british, australian, canadian, indian, chinese, korean, japanese, portuguese, russian |
| **Phương ngữ (tiếng Trung)** | 河南话, 四川话, 东北话, 云南话... (12 loại) |

### Personality Presets

Giao diện cung cấp các preset personality để chọn nhanh — load từ backend API `/personalities`.

---

## 9. Mẹo & Troubleshooting

### Mẹo tối ưu cho M2 Ultra

```
💡 Máy bạn (192GB RAM) rất mạnh:
  • Steps = 32 hoặc 64 không vấn đề
  • Không bao giờ cần offload CPU
  • Có thể chạy batch 50 files song song
  • MLX-Audio sẵn sàng (Apple Silicon exclusive)
```

### Troubleshooting thường gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| "Model loading failed: timed out" | HuggingFace download timeout | Restart `bun run dev`, nó sẽ resume. Hoặc set `HF_TOKEN` |
| Giọng clone không giống | Audio tham chiếu kém | Dùng audio sạch hơn, 5-10s, 1 người |
| Audio đầu ra có noise | Denoise tắt | Bật **Denoise** trong Production Overrides |
| Generate chậm | Steps quá cao | Giảm Steps xuống 16, tăng Speed lên 1.2 |
| "Ran out of memory" | Văn bản quá dài + Steps cao | Nhấn **Flush** trong UI, giảm Steps |
| Không nghe được tiếng Việt | Language = Auto bị nhầm | Chọn thủ công **Vietnamese** trong dropdown |

### Seed — Tái tạo kết quả

Mỗi lần generate, OmniVoice trả về `seed` trong response header. Để reproduce:

```bash
curl -X POST http://localhost:3900/generate \
  -F "text=Nội dung" \
  -F "ref_audio=@voice.wav" \
  -F "seed=12345" \
  --output output.wav
```

---

## 10. Bảng tham chiếu nhanh

### URLs

| Dịch vụ | URL |
|---|---|
| Web UI | http://localhost:3901 |
| API Backend | http://localhost:3900 |
| API Docs (Swagger) | http://localhost:3900/docs |
| OpenAI Compat | http://localhost:3900/v1/audio/speech |

### API Endpoints liên quan Voice Clone

| Method | Path | Chức năng |
|---|---|---|
| `POST` | `/generate` | Tạo audio (clone/design) |
| `GET` | `/history` | Lịch sử 50 lần generate |
| `DELETE` | `/history/{id}` | Xoá một item |
| `GET` | `/profiles` | Danh sách voice profiles |
| `POST` | `/profiles` | Tạo profile mới |
| `GET` | `/profiles/{id}` | Chi tiết profile |
| `GET` | `/profiles/{id}/audio` | Audio của profile |
| `GET` | `/profiles/{id}/usage` | Lịch sử sử dụng profile |
| `POST` | `/profiles/{id}/lock` | Khoá profile với seed |
| `POST` | `/profiles/{id}/unlock` | Mở khoá profile |
| `DELETE` | `/profiles/{id}` | Xoá profile |
| `GET` | `/personalities` | Preset personality list |
| `POST` | `/v1/audio/speech` | OpenAI-compat TTS |
| `GET` | `/v1/audio/voices` | List available voices |
| `GET` | `/model/status` | Trạng thái model |

### Keyboard shortcut

| Phím tắt | Chức năng |
|---|---|
| `⌘+⇧+Space` | Mở Dictation Widget (từ bất kỳ app) |

---

## Tham khảo thêm

- [Generation Parameters](./generation-parameters.md) — chi tiết toàn bộ tham số
- [Voice Design](./voice-design.md) — hướng dẫn voice design mode
- [Data Preparation](./data_preparation.md) — chuẩn bị dữ liệu huấn luyện
- [Languages](./languages.md) — danh sách 646 ngôn ngữ hỗ trợ
- [API Docs](http://localhost:3900/docs) — Swagger UI tương tác
