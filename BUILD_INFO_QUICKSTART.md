# 🚀 Quick Start: อัปเดตข้อมูล Build Info

## วิธีเพิ่มผู้พัฒนา

**ขั้นตอน:**

1. เปิดไฟล์ `public/config.json`
2. เพิ่มชื่อในส่วน `developers`:

```json
{
  "developers": [
    {
      "name": "ชื่อของคุณ",
      "github": "https://github.com/yourusername"
    }
  ]
}
```

3. บันทึกไฟล์

## วิธีอัปเดตวันที่

**คำสั่งเดียว:**

```bash
npm run update-config
```

✅ วันที่จะอัปเดตอัตโนมัติเป็นเวลาปัจจุบัน!

## ตรวจสอบข้อมูล

```bash
cat public/config.json
```

## Workflow แนะนำ

```bash
# 1. แก้ไขโค้ด
# ...

# 2. อัปเดตวันที่
npm run update-config

# 3. Commit & Push
git add .
git commit -m "คำอธิบาย"
git push
```

## ผลลัพธ์

ข้อมูลจะแสดงที่ด้านล่างหน้า Login:

```
Built by 🐙 B-bsw · 🐙 jrKitt | Last updated: 2026-02-27 21:37
```

---

**เอกสารเพิ่มเติม:**
- [BUILD_INFO_README.md](BUILD_INFO_README.md) - คู่มือฉบับเต็ม
- [CONFIG_UPDATE_GUIDE.md](CONFIG_UPDATE_GUIDE.md) - วิธีใช้งานขั้นสูง
