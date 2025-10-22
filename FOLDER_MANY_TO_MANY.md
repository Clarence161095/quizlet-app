# Folder Many-to-Many Feature Implementation

## Tổng quan
Đã chuyển đổi từ **one-to-many** (1 set chỉ thuộc 1 folder) sang **many-to-many** (1 set có thể thuộc nhiều folders, 1 folder chứa nhiều sets).

## Các thay đổi chính

### 1. Database Schema
- **Tạo bảng junction `folder_sets`**:
  ```sql
  CREATE TABLE folder_sets (
    id INTEGER PRIMARY KEY,
    folder_id INTEGER NOT NULL,
    set_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    UNIQUE(folder_id, set_id)
  )
  ```
- **Giữ nguyên `sets.folder_id`** cho backward compatibility
- **Migration**: `/src/database/add-folder-sets-junction.js`

### 2. Models Update

#### Folder Model (`/src/models/Folder.js`)
- ✅ `getSetsInFolder()` - Lấy sets qua junction table, ORDER BY `added_at`
- ✅ `getFlashcardsInFolder()` - Lấy flashcards từ tất cả sets trong folder
- ✅ `addSetToFolder(folderId, setId)` - Thêm set vào folder
- ✅ `removeSetFromFolder(folderId, setId)` - Xóa set khỏi folder
- ✅ `getFoldersForSet(setId)` - Lấy tất cả folders chứa 1 set

#### Set Model (`/src/models/Set.js`)
- ✅ `findByFolderId()` - Sử dụng junction table
- ✅ `getFolderNames(setId)` - Trả về chuỗi tên các folders (VD: "Folder1, Folder2")

#### LearningProgress Model (`/src/models/LearningProgress.js`)
- ✅ `getDueFlashcardsInFolder()` - Sử dụng junction table, ORDER BY `added_at`
- ✅ `getProgressStatsForFolder(userId, folderId)` - **MỚI**: Tính stats chính xác cho folder
  - Total cards
  - Mastered cards
  - Learning cards (có progress nhưng chưa mastered)
  - New cards = Total - Mastered - Learning

#### Flashcard Model (`/src/models/Flashcard.js`)
- ✅ `getStarredByFolderId()` - Sử dụng junction table

### 3. Routes Update

#### Folder Routes (`/src/routes/folders.js`)
- ✅ **View folder** (`GET /:id`) - Sử dụng `getProgressStatsForFolder()` để stats chính xác
- ✅ **Manage Sets** (`GET /:id/manage-sets`) - Trang quản lý sets trong folder
- ✅ **Add Set** (`POST /:id/add-set`) - Thêm set vào folder
- ✅ **Remove Set** (`POST /:folderId/remove-set/:setId`) - Xóa set khỏi folder
- ✅ **Study/Random** - Flashcards theo thứ tự `added_at` của junction table

#### Sets Routes (`/src/routes/sets.js`)
- ✅ **List sets** - Hiển thị tất cả folders chứa set (dùng `getFolderNames()`)

### 4. Views Update

#### `/src/views/folders/view.ejs`
- ✅ **Responsive buttons** - Mobile-friendly với flex-col/flex-row
- ✅ **Stats cards** - Hiển thị đúng Total/Mastered/Learning/New cho folder
- ✅ **Study Options** - Long-term Learning, Random All, Random Starred
- ✅ **Sets list** - Hiển thị danh sách sets trong folder
- ✅ **Manage Sets button** - Chỉ hiện với original folders (không phải cloned)

#### `/src/views/folders/manage-sets.ejs` (MỚI)
- ✅ **Two-column layout**:
  - **Left**: Sets hiện có trong folder (với nút Remove)
  - **Right**: Sets available để add (với nút Add)
- ✅ **Info box** - Giải thích về many-to-many folders

#### `/src/views/sets/index.ejs`
- ✅ Hiển thị nhiều folder names cho mỗi set

#### `/src/views/study/session.ejs`
- ✅ **Remove min-height 98vh** - Để content tự nhiên, không cần scroll khi không cần thiết
- ✅ **Flashcard min-height 450px** trên PC - Đủ lớn để hiển thị nội dung

### 5. Layout Update (`/src/views/layout.ejs`)
- ✅ **Flexbox layout**: `body` dùng flex-col với flex-1 cho main
- ✅ **Footer auto push**: `mt-auto` để footer luôn ở dưới cùng

## Workflow

### User thêm set vào folder:
1. Vào folder detail → Click "Manage Sets"
2. Chọn set từ "Available Sets" → Click "Add"
3. Set xuất hiện trong "Sets in This Folder"
4. Set vẫn có thể được thêm vào các folders khác

### User xóa set khỏi folder:
1. Vào folder detail → Click "Manage Sets"
2. Tìm set trong "Sets in This Folder" → Click "Remove"
3. Set bị xóa khỏi folder này NHƯNG không bị xóa khỏi database
4. Learning progress của set được giữ nguyên

### Study folder:
1. Vào folder detail → Click "Long-term Learning" hoặc "Random"
2. Flashcards từ TẤT CẢ sets trong folder được trộn lại
3. Thứ tự theo `added_at` của junction table (set nào add trước thì flashcards của nó xuất hiện trước)
4. Stats hiển thị chính xác cho tổng tất cả flashcards trong folder

## Technical Notes

### Order of Flashcards
- **Junction table `folder_sets.added_at`** quyết định thứ tự hiển thị
- Set được add vào folder trước → flashcards của nó xuất hiện trước khi study
- Trong mỗi set, flashcards vẫn giữ thứ tự `created_at DESC`

### Learning Progress
- **Độc lập giữa các folders** - Progress được lưu theo flashcard, không theo folder
- Học cùng 1 flashcard ở folder A hay folder B → cùng 1 progress record
- Stats folder = tổng hợp stats của tất cả flashcards trong tất cả sets của folder đó

### Backward Compatibility
- **Giữ nguyên `sets.folder_id`** - Không break code cũ
- Code mới nên dùng junction table `folder_sets`
- Old queries vẫn chạy nhưng không hỗ trợ many-to-many

## Files Changed
- ✅ `/src/database/add-folder-sets-junction.js` (NEW)
- ✅ `/src/models/Folder.js`
- ✅ `/src/models/Set.js`
- ✅ `/src/models/LearningProgress.js`
- ✅ `/src/models/Flashcard.js`
- ✅ `/src/routes/folders.js`
- ✅ `/src/routes/sets.js`
- ✅ `/src/views/folders/view.ejs`
- ✅ `/src/views/folders/manage-sets.ejs` (NEW)
- ✅ `/src/views/sets/index.ejs`
- ✅ `/src/views/study/session.ejs`
- ✅ `/src/views/layout.ejs`

## Testing Checklist
- [ ] Tạo folder mới
- [ ] Add nhiều sets vào 1 folder
- [ ] Add 1 set vào nhiều folders
- [ ] Remove set khỏi folder (set vẫn tồn tại)
- [ ] Study folder - kiểm tra flashcards theo thứ tự added_at
- [ ] Kiểm tra stats: Total/Mastered/Learning/New đúng
- [ ] Delete folder (sets không bị xóa)
- [ ] Responsive UI trên mobile/tablet/desktop
- [ ] Footer luôn ở dưới cùng
- [ ] Study session không cần scroll khi nội dung vừa đủ
