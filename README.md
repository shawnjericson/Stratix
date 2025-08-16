
# Stratix – Task Management System

Ứng dụng quản lý công việc (**React + Tailwind** ở frontend, **Express + PostgreSQL (Supabase)** ở backend), triển khai trên **Vercel**.  
Hỗ trợ **đăng nhập & phân quyền**, **bảng Kanban**, và **tìm kiếm có debounce** để tối ưu hiệu năng.

> ⚠️ Thay các domain dưới đây cho đúng dự án của bạn.
- Frontend (Vercel): https://stratix-sand.vercel.app/
- Backend API (Vercel): https://stratixbackend.vercel.app/api

---

## Tính năng chính
- **Đăng nhập & Phân quyền**: người dùng đăng nhập, gán vai trò (**Admin**, **Manager**, **Member**). Truy cập API được kiểm soát bằng middleware.
- **Bảng Kanban**: các cột *To Do*, *In Progress*, *Review*, *Done*; kéo thả thay đổi trạng thái (nếu cần, dùng API `PATCH /api/tasks/:id/status`).
- **Tìm kiếm có Debounce**: ô tìm kiếm chỉ gọi API sau một khoảng trễ (mặc định ~300ms) để giảm request dư thừa.
- CRUD **Tasks**: tạo / sửa / đổi trạng thái / xóa (theo quyền).
- **Kiến trúc tách lớp**: UI ↔ Services (API) ↔ Server (routes, controllers, middleware) ↔ DB.
- **Supabase (Postgres)**: lưu dữ liệu; có thể bật **RLS** để tăng bảo mật (tùy yêu cầu).
- **Triển khai Vercel**: monorepo hoặc tách frontend/backend thành 2 project.

---

## Kiến trúc & Công nghệ
- **Frontend**: React (Create React App), **Tailwind CSS**.
- **Backend**: Node.js + **Express**.
- **CSDL**: **PostgreSQL** trên **Supabase**.
- **Triển khai**: **Vercel** (Functions cho API; Static build cho FE).
- **CORS**: cấu hình cho phép FE local (`http://localhost:3000`) và domain Vercel.

```text
root
├─ frontend/                  # React + Tailwind
│  ├─ public/index.html
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ hooks/               # useAuth, ...
│  │  ├─ services/            # api.js (fetch tới backend)
│  │  └─ App.jsx
│  └─ package.json
└─ backend/                   # Express + routes /api/*
   ├─ index.js                # tạo app, middleware, routes
   ├─ config                   # kết nối DB (Supabase Postgres)
   ├─ routes/
   │  ├─ auth.routes.js       # /api/auth/*
   │  └─ tasks.routes.js      # /api/tasks/*
   ├─ controllers/            # auth.controller.js, tasks.controller.js
   ├─ middleware/
   │  ├─ auth.js              # verify JWT
   └─ package.json
```

---

## Đăng nhập & Phân quyền (RBAC)
- **Đăng nhập**: FE gửi `email/password` tới `POST /api/auth/login`. Backend kiểm tra DB → ký **JWT** (chứa `userId`, `role`) → FE lưu trong memory/localStorage.
- **Bảo vệ route**: middleware `auth` kiểm tra `Authorization: Bearer <token>`; middleware `rbac(...roles)` kiểm tra quyền truy cập.
- **Ví dụ quyền**:
  - **Admin**: toàn quyền (CRUD users, tasks).
  - **Manager**: CRUD tasks trong team.
  - **Member**: xem & cập nhật task của mình.

## 📝 Giải thích kiến trúc & code
1) **Tách lớp rõ ràng**:  
   - *Frontend* chỉ xử lý UI/UX (React + Tailwind), gọi API qua `services/api.js`.  
   - *Backend* chịu trách nhiệm xác thực, phân quyền, nghiệp vụ (controllers), và truy cập DB.  
   - *Database* (Supabase) lưu trữ dữ liệu quan hệ, có bảng lịch sử trạng thái để audit.

2) **Bảo mật & Phân quyền**:  
   - Đăng nhập trả **JWT** chứa `userId` + `role`.  
   - Mọi API nhạy cảm bắt buộc `Authorization: Bearer <token>`.  
   - Middleware RBAC chặn truy cập sai vai trò (ví dụ, chỉ `ADMIN/MANAGER` mới xóa task).

3) **Tối ưu trải nghiệm**:  
   - **Debounced search** giảm số lần gọi API khi người dùng gõ nhanh.  
   - **Kanban** phản hồi theo thời gian thực (tuỳ chọn), cập nhật UI ngay sau khi PATCH thành công.

4) **Hiệu năng serverless**:  
   - Kết nối DB dạng **singleton pool** để không vượt quá giới hạn kết nối (*max clients reached*).  
   - API dùng transaction khi đổi trạng thái để đảm bảo tính nhất quán và ghi lịch sử.

5) **Triển khai đơn giản trên Vercel**:  
   - FE build thành static files → render nhanh từ CDN biên.  
   - BE chạy dưới dạng serverless function `/api/*` → dễ mở rộng, bảo trì.

> Core luồng: **User** → (React) **Frontend** → gọi **Backend /api** → truy vấn **Postgres (Supabase)** → trả về JSON → FE cập nhật UI (Kanban/Search).

---

## 📄 Giấy phép
Dùng nội bộ học tập / demo. Bản quyền thuộc tác giả dự án.

