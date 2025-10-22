# TODO - Remaining Views to Create

This document lists all the EJS views that still need to be created for the application to work completely.

## ✅ Already Created
- [x] src/views/layout.ejs
- [x] src/views/auth/login.ejs
- [x] src/views/auth/mfa-setup.ejs
- [x] src/views/auth/mfa-verify.ejs
- [x] src/views/dashboard/index.ejs

## 📝 Views Still Needed

### Authentication Views
- [ ] src/views/auth/change-password.ejs

### Admin Views
- [ ] src/views/admin/index.ejs (Admin dashboard với danh sách users)
- [ ] src/views/admin/create-user.ejs (Form tạo user mới)

### Folder Views
- [ ] src/views/folders/index.ejs (Danh sách folders)
- [ ] src/views/folders/create.ejs (Form tạo folder)
- [ ] src/views/folders/view.ejs (Xem chi tiết folder)
- [ ] src/views/folders/edit.ejs (Form sửa folder)

### Set Views
- [ ] src/views/sets/index.ejs (Danh sách sets)
- [ ] src/views/sets/create.ejs (Form tạo set)
- [ ] src/views/sets/view.ejs (Xem chi tiết set với danh sách flashcards)
- [ ] src/views/sets/edit.ejs (Form sửa set)
- [ ] src/views/sets/import.ejs (Form import flashcards)

### Flashcard Views
- [ ] src/views/flashcards/create.ejs (Form tạo flashcard)
- [ ] src/views/flashcards/edit.ejs (Form sửa flashcard với note)

### Study Views
- [ ] src/views/study/session.ejs (Giao diện học tập - QUAN TRỌNG NHẤT!)

### Error Views
- [ ] src/views/error.ejs (Trang lỗi 404/500)

## 🎯 Priority Order

### HIGH Priority (App sẽ crash nếu thiếu)
1. **src/views/error.ejs** - Required for error handling
2. **src/views/auth/change-password.ejs** - Required for password change flow
3. **src/views/study/session.ejs** - Core feature - study interface

### MEDIUM Priority (Core features)
4. src/views/sets/create.ejs
5. src/views/sets/view.ejs
6. src/views/flashcards/create.ejs
7. src/views/sets/import.ejs

### LOW Priority (Can work without these initially)
8. src/views/folders/create.ejs
9. src/views/folders/view.ejs
10. src/views/admin/index.ejs

## 📋 Template Structure for Views

Most views should follow this structure:

```ejs
<div class="max-w-4xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">
      <i class="fas fa-icon"></i> Page Title
    </h1>
    <p class="text-gray-600">Page description</p>
  </div>

  <div class="bg-white p-6 rounded-lg shadow">
    <!-- Content here -->
  </div>
</div>
```

## 🚀 Quick Start Without All Views

The application can run with minimal views if you:
1. Create the error.ejs view
2. Create basic CRUD views for sets
3. Create the study session view
4. Comment out routes for features not yet implemented

## 📝 Notes

- All views use Tailwind CSS for styling
- All views should be mobile-first responsive
- Use Font Awesome icons for visual elements
- Follow the existing pattern in layout.ejs for consistency
- Flash messages are handled in layout.ejs

## 🔧 How to Create Views Quickly

You can use this template as a starting point for most forms:

```ejs
<div class="max-w-2xl mx-auto">
  <div class="bg-white p-8 rounded-lg shadow">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">
      <i class="fas fa-icon"></i> Title
    </h1>

    <form action="/your-route" method="POST">
      <!-- Form fields here -->
      
      <div class="flex space-x-4">
        <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          <i class="fas fa-save"></i> Save
        </button>
        <a href="/back" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
          <i class="fas fa-times"></i> Cancel
        </a>
      </div>
    </form>
  </div>
</div>
```

## 🎨 Common Tailwind Classes Used

- Container: `max-w-7xl mx-auto`, `max-w-4xl mx-auto`, `max-w-2xl mx-auto`
- Cards: `bg-white p-6 rounded-lg shadow`
- Buttons: `bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700`
- Inputs: `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

## 🐛 Testing Strategy

1. Test authentication flow first (login, MFA)
2. Test creating a set
3. Test adding flashcards
4. Test study session
5. Test all other features

## ⚡ Performance Notes

- Views are rendered server-side with EJS
- Tailwind CSS is loaded from CDN (consider local copy for production)
- Font Awesome is loaded from CDN
- No heavy JavaScript frameworks - vanilla JS for interactions
