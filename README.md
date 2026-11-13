# Pharmacy Admin

Trang quản trị (admin dashboard) cho hệ thống nhà thuốc trực tuyến. Quản trị viên dùng trang này để quản lý sản phẩm, danh mục, nhà cung cấp, đơn hàng, người dùng, chương trình khuyến mãi và cấu hình nội dung hiển thị trên website bán hàng ([pharmacy-ui](../pharmacy-ui)).

## Công nghệ

- **React 18** + **TypeScript**, build bằng **Vite** (plugin SWC)
- **Tailwind CSS** + **shadcn/ui** (Radix UI), icon **lucide-react**
- **TanStack React Query**: fetch dữ liệu, cache, mutation
- **React Router v6**: định tuyến, chặn route khi chưa đăng nhập
- **Axios** + **js-cookie**: gọi REST API, lưu JWT
- **Recharts**: biểu đồ trên Dashboard
- **Vitest** + Testing Library: kiểm thử

## Chức năng

| Route | Trang | Mô tả |
|---|---|---|
| `/dang-nhap` | Đăng nhập | Đăng nhập bằng tài khoản admin |
| `/` | Dashboard | Thống kê tổng quan, biểu đồ |
| `/quan-ly-san-pham` | Sản phẩm | Thêm, sửa, xóa, tìm kiếm sản phẩm, upload ảnh (multipart) |
| `/quan-ly-danh-muc` | Danh mục | Thêm, sửa, xóa danh mục |
| `/quan-ly-nha-cung-cap` | Nhà cung cấp | Thêm, sửa, xóa nhà sản xuất kèm logo |
| `/quan-ly-don-hang` | Đơn hàng | Xem đơn, cập nhật trạng thái đơn hàng và trạng thái thanh toán |
| `/danh-sach-nguoi-dung` | Người dùng | Danh sách và chi tiết khách hàng |
| `/quan-ly-su-kien` | Sự kiện / Flash sale | Tạo sự kiện giảm giá, thêm hoặc gỡ sản phẩm khỏi sự kiện |
| `/quan-ly-the` | Thẻ | Bật/tắt và sắp xếp thứ tự các thẻ ở trang chủ |
| `/quan-ly-noi-dung` | Nội dung | Bật/tắt và sắp xếp các section ở trang chủ website |
| `/cai-dat` | Cài đặt | Cài đặt hệ thống |

Mọi route trừ `/dang-nhap` đều bọc trong `ProtectedRoute`. Nếu chưa đăng nhập, người dùng sẽ bị chuyển về trang đăng nhập.

## Cấu trúc thư mục

```
src/
├── components/
│   ├── ui/                 # Component shadcn/ui
│   ├── AppHeader.tsx
│   ├── AppSidebar.tsx
│   ├── DashboardLayout.tsx # Layout chung: sidebar + header
│   └── NavLink.tsx
├── contexts/
│   └── AuthContext.tsx     # Trạng thái đăng nhập, login/logout
├── hooks/                  # use-toast, use-mobile
├── lib/
│   ├── api.ts              # Axios instance và các nhóm API
│   └── utils.ts
├── pages/                  # Mỗi trang quản lý một file
├── test/                   # Cấu hình và test Vitest
├── App.tsx                 # Khai báo route, provider
└── main.tsx
```

## Kết nối backend

Cấu hình trong [src/lib/api.ts](src/lib/api.ts):

```ts
const BASE_URL = "https://pharmacy-webapp-backend-nh7b.onrender.com";
// const BASE_URL = "http://localhost:8080";   // khi chạy backend local
```

- Request interceptor tự gắn `Authorization: Bearer <token>`, token lấy từ cookie `auth_token`.
- Response interceptor tự bóc `{ success, message, data }`: nếu `success = false` thì reject kèm `message`, ngược lại trả về `data`.
- Các nhóm API: `authApi`, `productsApi`, `categoriesApi`, `manufacturerApi`, `billApi`, `usersApi`, `discountEventApi`, `tagsApi`, `sectionsApi`.

## Cài đặt và chạy

Yêu cầu: Node.js 18 trở lên.

```sh
npm install
npm run dev        # chạy dev tại http://localhost:5173
```

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` | Build production vào thư mục `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra ESLint |
| `npm test` | Chạy test (Vitest) |

## Deploy

Build ra web tĩnh trong `dist/`. File [public/_redirects](public/_redirects) (`/* /index.html 200`) giúp Netlify trả về `index.html` cho mọi route của SPA.
