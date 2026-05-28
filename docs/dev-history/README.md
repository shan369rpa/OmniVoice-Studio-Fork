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

---

> **Lưu ý cho Agent**: Đọc các file trong thư mục này trước khi sửa code liên quan đến Tauri, export, hay platform-specific logic. Nhiều bug ở đây có pattern tái phát.
