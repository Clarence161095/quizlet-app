# Quizlet Learning App - Quick Start Guide

## Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi tạo database
```bash
npm run init-db
```

### 3. Chạy ứng dụng
```bash
npm start
```

Hoặc sử dụng boot script:
```bash
chmod +x boot.sh
./boot.sh
```

## Tài khoản mặc định

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Quan trọng**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

## Tính năng chính

### 1. Quản lý Flashcards
- Tạo, sửa, xóa flashcards
- Import/Export flashcards từ text
- Hỗ trợ markdown cho notes
- Đánh dấu sao cho flashcards quan trọng

### 2. Tổ chức
- **Sets**: Bộ flashcards
- **Folders**: Thư mục chứa nhiều sets
- Folder hoạt động như một set lớn

### 3. Học tập thông minh (Spaced Repetition)
- Thuật toán SM-2 cải tiến
- Lịch ôn tập: 1, 3, 7, 15, 30, 60, 90 ngày
- Đánh dấu "đã thuộc" sau 7 lần đúng liên tiếp
- Ưu tiên các từ chưa thuộc

### 4. Chế độ học
- **Long-term Learning**: Học dài hạn theo lịch
- **Random All**: Ôn tập ngẫu nhiên tất cả
- **Random Starred**: Chỉ ôn tập các thẻ đã đánh dấu sao

### 5. Trắc nghiệm Multiple Choice
Hỗ trợ format câu hỏi trắc nghiệm:

```
Word: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Hồ Chí Minh
C. Đà Nẵng
D. Huế

Definition: A
```

### 6. Personal Notes
- Mỗi user có note riêng cho từng flashcard
- Hỗ trợ markdown
- Không chia sẻ với user khác

## Workflow sử dụng

### Tạo bộ thẻ mới
1. Đăng nhập
2. Dashboard → New Set
3. Điền tên và mô tả
4. Thêm flashcards (thủ công hoặc import)

### Import flashcards từ text
1. Mở Set → Import
2. Chọn ký tự phân tách (mặc định: Tab cho term/definition, Enter cho cards)
3. Paste nội dung:
   ```
   Hello	Xin chào
   Goodbye	Tạm biệt
   Thank you	Cảm ơn
   ```
4. Preview và Import

### Học dài hạn
1. Mở Set/Folder → Study
2. Xem flashcard
3. Click để lật thẻ
4. Đánh giá: Correct hoặc Incorrect
5. Hệ thống tự động lên lịch ôn tập tiếp theo

### Ôn tập nhanh
1. Mở Set/Folder → Random
2. Chọn "All" hoặc "Starred only"
3. Luyện tập không theo lịch

## Cấu trúc Database

### Tables
- `users`: Người dùng
- `folders`: Thư mục
- `sets`: Bộ thẻ
- `flashcards`: Thẻ học
- `user_notes`: Ghi chú cá nhân
- `learning_progress`: Tiến trình học tập (SM-2)
- `study_sessions`: Phiên học
- `study_answers`: Câu trả lời trong phiên học

## API Routes

### Authentication
- `GET /auth/login` - Trang đăng nhập
- `POST /auth/login` - Xử lý đăng nhập
- `GET /auth/logout` - Đăng xuất
- `GET /auth/mfa-setup` - Cài đặt MFA
- `GET /auth/mfa-verify` - Xác thực MFA
- `GET /auth/change-password` - Đổi mật khẩu

### Admin
- `GET /admin` - Trang quản trị
- `POST /admin/users/create` - Tạo user mới
- `POST /admin/users/:id/toggle-active` - Kích hoạt/vô hiệu hóa user
- `POST /admin/users/:id/reset-password` - Reset mật khẩu

### Folders
- `GET /folders` - Danh sách folders
- `POST /folders/create` - Tạo folder
- `GET /folders/:id` - Xem folder
- `GET /folders/:id/study` - Học folder
- `GET /folders/:id/random` - Ôn tập ngẫu nhiên

### Sets
- `GET /sets` - Danh sách sets
- `POST /sets/create` - Tạo set
- `GET /sets/:id` - Xem set
- `GET /sets/:id/import` - Import flashcards
- `GET /sets/:id/export` - Export flashcards
- `GET /sets/:id/study` - Học set
- `GET /sets/:id/random` - Ôn tập ngẫu nhiên

### Flashcards
- `POST /flashcards/create/:setId` - Tạo flashcard
- `POST /flashcards/:id/edit` - Sửa flashcard
- `POST /flashcards/:id/toggle-star` - Đánh dấu sao
- `POST /flashcards/:id/delete` - Xóa flashcard

### Study
- `POST /study/answer` - Gửi câu trả lời

## Environment Variables

```env
PORT=3000                          # Port server
NODE_ENV=production                # Environment
SESSION_SECRET=your-secret-here    # Session secret (đổi trước khi deploy!)
APP_NAME=Quizlet Learning App      # Tên app
```

## Tips & Tricks

### 1. Import nhanh từ Quizlet
- Export từ Quizlet dạng text
- Copy và paste vào Import
- Chọn separator phù hợp
- Import!

### 2. Tổ chức hiệu quả
- Dùng Folders cho chủ đề lớn (ví dụ: "Tiếng Anh")
- Dùng Sets cho chủ đề nhỏ (ví dụ: "Unit 1", "Unit 2")
- Đặt tên rõ ràng, dễ tìm kiếm

### 3. Học hiệu quả
- Học đều đặn mỗi ngày
- Ưu tiên "Long-term Learning"
- Sử dụng "Random" để warm-up trước khi học bài mới
- Thêm notes cho từ khó nhớ

### 4. Multiple Choice
- Format câu hỏi chuẩn: A, B, C, D
- Definition có thể là 1 đáp án (A) hoặc nhiều (A, C)
- Hệ thống tự động nhận dạng

### 5. Backup
```bash
# Backup database
cp data/quizlet.db backup-$(date +%Y%m%d).db

# Restore
cp backup-20250101.db data/quizlet.db
```

## Troubleshooting

### Không đăng nhập được
- Kiểm tra username/password
- Đảm bảo account đã được active (admin phê duyệt)

### MFA không hoạt động
- Kiểm tra thời gian trên thiết bị
- Thử quét lại QR code
- Dùng secret key thủ công

### Database bị lỗi
```bash
npm run init-db
```

### Port 3000 đã được sử dụng
- Đổi PORT trong .env
- Hoặc kill process đang dùng port 3000

## Deployment

Xem file `DEPLOYMENT.md` để biết hướng dẫn chi tiết deploy lên AWS EC2.

## Development

```bash
# Development mode với auto-reload
npm run dev

# Initialize database
npm run init-db

# Production mode
npm start
```

## Tech Stack

- **Backend**: Express.js
- **Database**: SQLite3 (better-sqlite3)
- **Views**: EJS
- **CSS**: Tailwind CSS
- **Auth**: Passport.js + bcryptjs
- **MFA**: Speakeasy + QRCode
- **Session**: express-session + connect-sqlite3

## File Structure

```
src/
├── config/          # Cấu hình (passport, etc.)
├── database/        # Database initialization
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # Express routes
├── views/           # EJS templates
└── server.js        # Main server file

data/                # Database files (auto-created)
public/              # Static assets
```

## Contributing

Nếu bạn muốn contribute:
1. Fork repo
2. Tạo branch mới
3. Commit changes
4. Push và tạo Pull Request

## License

MIT

## Support

Nếu có vấn đề, tạo issue trên GitHub hoặc liên hệ admin.
