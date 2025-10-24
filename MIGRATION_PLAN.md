# Migration Plan: EJS → React + Vite SPA

## Mục tiêu
Chuyển đổi ứng dụng flashcard từ server-side rendering (Express + EJS) sang Single Page Application (React + Vite) trong khi giữ nguyên 100% backend và database hiện tại.

## Lý do Migration
- Giảm thiểu việc load lại trang
- Tăng trải nghiệm người dùng
- UI/UX mượt mà hơn với React
- State management tốt hơn trên client

## Nguyên tắc Migration
✅ **GIỮ NGUYÊN**:
- Toàn bộ backend Express.js
- Toàn bộ database SQLite và schema
- Toàn bộ business logic trong models
- Authentication flow (Passport.js + session)
- API endpoints structure

🔄 **THAY ĐỔI**:
- Frontend từ EJS → React components
- Rendering từ server-side → client-side
- Navigation từ full page reload → React Router
- Backend sẽ serve JSON thay vì render HTML

---

## Checklist Migration

### Phase 1: Chuẩn bị và Setup ⬜
- [ ] 1.1. Tạo cấu trúc thư mục cho React app
- [ ] 1.2. Cài đặt Vite + React dependencies
- [ ] 1.3. Cấu hình Vite (proxy, build output)
- [ ] 1.4. Setup React Router
- [ ] 1.5. Setup Axios cho API calls
- [ ] 1.6. Tạo base layout components

### Phase 2: Chuyển đổi Backend sang API Mode ⬜
- [ ] 2.1. Tạo API routes mới (hoặc modify existing routes)
- [ ] 2.2. Chuyển đổi routes để return JSON thay vì render EJS
- [ ] 2.3. Giữ nguyên authentication middleware
- [ ] 2.4. Thêm CORS configuration nếu cần
- [ ] 2.5. Tạo API endpoints cho:
  - [ ] Auth (login, logout, check session, MFA)
  - [ ] Dashboard
  - [ ] Sets (CRUD)
  - [ ] Folders (CRUD)
  - [ ] Flashcards (CRUD)
  - [ ] Study sessions
  - [ ] Shares
  - [ ] Admin

### Phase 3: Xây dựng React Components ⬜
- [ ] 3.1. **Layout & Navigation**
  - [ ] App.jsx (main component)
  - [ ] Layout.jsx
  - [ ] Navigation.jsx
  - [ ] PrivateRoute component

- [ ] 3.2. **Authentication Pages**
  - [ ] Login.jsx
  - [ ] MFAVerify.jsx
  - [ ] MFASetup.jsx
  - [ ] ChangePassword.jsx

- [ ] 3.3. **Dashboard**
  - [ ] Dashboard.jsx
  
- [ ] 3.4. **Sets Management**
  - [ ] SetsList.jsx
  - [ ] SetCreate.jsx
  - [ ] SetEdit.jsx
  - [ ] SetView.jsx
  - [ ] SetImport.jsx
  - [ ] SetExport.jsx

- [ ] 3.5. **Folders Management**
  - [ ] FoldersList.jsx
  - [ ] FolderCreate.jsx
  - [ ] FolderEdit.jsx
  - [ ] FolderView.jsx
  - [ ] FolderManageSets.jsx

- [ ] 3.6. **Flashcards Management**
  - [ ] FlashcardCreate.jsx
  - [ ] FlashcardEdit.jsx

- [ ] 3.7. **Study Session**
  - [ ] StudySession.jsx (complex component with flip animation)
  - [ ] StudyCard.jsx
  - [ ] StudyStats.jsx
  - [ ] StudyFilters.jsx

- [ ] 3.8. **Shares Management**
  - [ ] ShareSet.jsx
  - [ ] ShareFolder.jsx
  - [ ] MyShares.jsx

- [ ] 3.9. **Admin Pages**
  - [ ] AdminDashboard.jsx
  - [ ] CreateUser.jsx

### Phase 4: State Management ⬜
- [ ] 4.1. Setup Context API hoặc Redux (nếu cần)
- [ ] 4.2. AuthContext (user session state)
- [ ] 4.3. FlashContext (flash messages)
- [ ] 4.4. StudyContext (study session state)

### Phase 5: Styles & Assets ⬜
- [ ] 5.1. Integrate Tailwind CSS với Vite
- [ ] 5.2. Copy/migrate CSS animations (flip card, etc.)
- [ ] 5.3. Setup FontAwesome icons
- [ ] 5.4. Responsive design (mobile-first)

### Phase 6: Advanced Features ⬜
- [ ] 6.1. Focus Mode (fullscreen study)
- [ ] 6.2. Keyboard shortcuts
- [ ] 6.3. LocalStorage integration (filter states)
- [ ] 6.4. Real-time stats updates
- [ ] 6.5. Star toggle functionality
- [ ] 6.6. Multi-choice mode
- [ ] 6.7. Spaced repetition visualization

### Phase 7: Testing & Bug Fixes ⬜
- [ ] 7.1. Test authentication flow (login, logout, MFA)
- [ ] 7.2. Test CRUD operations (Sets, Folders, Flashcards)
- [ ] 7.3. Test study session (flip, answer, progress)
- [ ] 7.4. Test sharing features
- [ ] 7.5. Test import/export
- [ ] 7.6. Test responsive design (mobile, tablet, desktop)
- [ ] 7.7. Test keyboard shortcuts
- [ ] 7.8. Cross-browser testing

### Phase 8: Deployment Configuration ⬜
- [ ] 8.1. Update build scripts
- [ ] 8.2. Configure Express to serve React build
- [ ] 8.3. Update boot.sh for production
- [ ] 8.4. Test production build locally
- [ ] 8.5. Update deployment documentation

### Phase 9: Final Cleanup ⬜
- [ ] 9.1. Remove old EJS views (backup first)
- [ ] 9.2. Remove EJS dependencies
- [ ] 9.3. Update README.md
- [ ] 9.4. Update DEVELOPMENT.md
- [ ] 9.5. Create migration summary document

---

## Cấu trúc thư mục mới

```
quizlet-app/
├── client/                      # NEW - React Frontend
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── sets/
│   │   │   ├── folders/
│   │   │   ├── flashcards/
│   │   │   ├── study/
│   │   │   ├── shares/
│   │   │   └── admin/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/          # API calls
│   │   ├── utils/
│   │   └── styles/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── src/                         # EXISTING - Backend
│   ├── server.js               # Modified to serve React build
│   ├── routes/                 # Modified to return JSON
│   ├── models/                 # Unchanged
│   ├── middleware/             # Unchanged
│   ├── database/               # Unchanged
│   └── config/                 # Unchanged
├── data/                        # Unchanged
└── package.json                # Updated with new scripts
```

---

## Dependencies mới cần cài đặt

### Client (React app)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  }
}
```

### Server (minimal changes)
- Giữ nguyên tất cả dependencies hiện tại
- Có thể thêm `cors` nếu cần

---

## API Endpoints cần tạo/modify

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check current session
- `POST /api/auth/mfa-verify` - Verify MFA
- `GET /api/auth/mfa-setup` - Get MFA setup data
- `POST /api/auth/mfa-setup` - Complete MFA setup
- `POST /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Sets
- `GET /api/sets` - List all sets
- `GET /api/sets/:id` - Get single set
- `POST /api/sets` - Create set
- `PUT /api/sets/:id` - Update set
- `DELETE /api/sets/:id` - Delete set
- `POST /api/sets/:id/import` - Import flashcards
- `GET /api/sets/:id/export` - Export flashcards

### Folders
- `GET /api/folders` - List all folders
- `GET /api/folders/:id` - Get single folder
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder
- `GET /api/folders/:id/sets` - Get sets in folder
- `POST /api/folders/:id/sets` - Add set to folder
- `DELETE /api/folders/:id/sets/:setId` - Remove set from folder

### Flashcards
- `POST /api/flashcards` - Create flashcard
- `PUT /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard
- `POST /api/flashcards/:id/star` - Toggle star

### Study
- `GET /api/study/session/:type/:id` - Get study session data
- `POST /api/study/answer` - Submit answer
- `POST /api/flashcards/:id/note` - Save/update note

### Shares
- `GET /api/shares` - Get user's shares
- `POST /api/shares/set` - Share set
- `POST /api/shares/folder` - Share folder
- `POST /api/shares/:id/accept` - Accept share
- `DELETE /api/shares/:id` - Delete share
- `POST /api/shares/:id/update-from-source` - Update from source

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/users` - Create user

---

## Chiến lược Migration từng bước

### Bước 1: Setup cơ bản
1. Tạo thư mục `client/`
2. Init Vite project
3. Cài đặt dependencies
4. Cấu hình Vite proxy đến backend
5. Test basic React app

### Bước 2: Backend API
1. Tạo file `src/routes/api.js` hoặc modify existing routes
2. Wrap existing logic trong JSON response
3. Test API endpoints với Postman/curl

### Bước 3: Frontend từng module
1. Bắt đầu với Auth (login, logout)
2. Tiếp theo Dashboard
3. Sau đó Sets, Folders, Flashcards
4. Cuối cùng Study Session (phức tạp nhất)

### Bước 4: Polish & Deploy
1. Test toàn bộ tính năng
2. Fix bugs
3. Optimize performance
4. Deploy

---

## Risks & Mitigation

### Risk 1: Session authentication với SPA
**Problem**: Cookie-based session có thể gặp vấn đề với CORS
**Solution**: 
- Configure CORS đúng cách
- Ensure `credentials: 'include'` trong Axios
- Backend phải set `Access-Control-Allow-Credentials: true`

### Risk 2: MFA flow phức tạp
**Problem**: MFA require multiple redirects
**Solution**: 
- Implement proper routing với React Router
- Store MFA state trong context

### Risk 3: Study session animations
**Problem**: CSS animations phức tạp từ EJS
**Solution**: 
- Copy exact CSS vào React
- Use inline styles hoặc styled-components nếu cần
- Test thoroughly

### Risk 4: File upload/download
**Problem**: Import/Export flashcards
**Solution**: 
- Use FormData cho upload
- Use blob download cho export

### Risk 5: Real-time updates
**Problem**: Stats update sau mỗi answer
**Solution**: 
- Use React state management
- Update local state sau API call

---

## Timeline ước tính

- **Phase 1**: 1 ngày
- **Phase 2**: 2-3 ngày
- **Phase 3**: 5-7 ngày (largest phase)
- **Phase 4**: 1 ngày
- **Phase 5**: 1-2 ngày
- **Phase 6**: 2-3 ngày
- **Phase 7**: 2-3 ngày
- **Phase 8**: 1 ngày
- **Phase 9**: 1 ngày

**Total**: 16-23 ngày (3-4 tuần)

---

## Current Status: ⬜ NOT STARTED

**Next Action**: Start Phase 1 - Setup & Preparation
