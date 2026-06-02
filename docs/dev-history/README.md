# 📋 Dev History — OmniVoice Studio

Thư mục này ghi lại **lịch sử thay đổi code cụ thể** ngoài commit message thông thường:
- Bug fixes quan trọng với trace đầy đủ
- Quyết định kỹ thuật (why, không chỉ what)
- Gotchas / anti-patterns cần tránh cho agent/developer sau

## Quy tắc đặt tên file

```
YYYY-MM-DD_<loai>_<mo-ta-ngan>.md

Ví dụ:
  2026-05-18_bugfix_tauri-invoke-export.md
  2026-05-20_feat_add-meditation-dsp-preset.md
  2026-05-22_refactor_cleanup-dubworkflow.md
```

## Danh sách entries

| Ngày | Loại | File | Tóm tắt |
|------|------|------|---------|
| 2026-05-18 | bugfix | [2026-05-18_bugfix_tauri-invoke-export.md](./2026-05-18_bugfix_tauri-invoke-export.md) | `Export failed: Cannot read properties of undefined (reading 'invoke')` |
| 2026-05-28 | fix | [2026-05-28_fix_lan-clone-mode.md](./2026-05-28_fix_lan-clone-mode.md) | CORS, loopback guard, API URL hardcode, auto-transcribe — LAN clone mode |
| 2026-06-01 | fix+refactor+feat | [2026-06-01_fix_audio-trimmer-preview.md](./2026-06-01_fix_audio-trimmer-preview.md) | AudioTrimmer: Preview fix, playRegion refactor, played-region color, click-to-play, timecode input |

---

> **Lưu ý cho Agent**: Đọc các file trong thư mục này trước khi sửa code liên quan đến Tauri, export, hay platform-specific logic. Nhiều bug ở đây có pattern tái phát.
