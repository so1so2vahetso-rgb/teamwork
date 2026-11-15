# Task 2 — Tạo project Firebase miễn phí

## Trước khi bắt đầu

Mục tiêu task này là tạo project của bạn, cấu hình SDK và khóa quyền dữ liệu ban đầu. Chưa làm đăng ký/đăng nhập thật, chưa tạo dữ liệu người dùng. Không nâng cấp Blaze, không thêm thẻ, không bật tài khoản thanh toán. Spark có hạn mức; miễn phí không có nghĩa sử dụng vô hạn.

## 1. Tạo project Spark

1. Mở [Firebase Console](https://console.firebase.google.com/), đăng nhập tài khoản Google của bạn.
2. Chọn **Create a project / Tạo dự án**. Đặt tên dễ nhớ, ví dụ `TeamWork`. Project ID có thể được Firebase tự thêm phần đuôi; ghi lại ID thực tế.
3. Nếu được hỏi Google Analytics hoặc tính năng AI tùy chọn, có thể bỏ qua/tắt; đồ án không cần các phần đó.
4. Tạo project. Kiểm tra trang tổng quan hiển thị **Spark / No-cost**. Nếu gặp đề nghị gắn billing hoặc nâng cấp Blaze, không chọn nâng cấp.

## 2. Đăng ký Web App

1. Trong project, chọn biểu tượng **Web `</>`**; hoặc vào **Project settings → General → Your apps → Add app → Web**.
2. Đặt tên ứng dụng `teamwork-web`.
3. Nếu có tùy chọn thiết lập Hosting ngay, bỏ chọn. Hosting để task 12.
4. Chọn **Register app**, chọn hướng dẫn dùng **npm**.
5. Tìm đoạn `const firebaseConfig = { ... }`. Chỉ cần bốn giá trị: `apiKey`, `authDomain`, `projectId`, `appId`.

Bạn có thể gửi đoạn firebaseConfig cho trợ lý để điền đúng project. Đây là cấu hình ứng dụng web; không gửi mật khẩu Google, khóa service account hay JSON chứa private_key. Không lấy cấu hình từ ví dụ trên mạng.

## 3. Bật đăng nhập email/mật khẩu

1. Vào **Authentication → Get started → Sign-in method**.
2. Chọn **Email/Password**, bật **Email/Password** rồi Save. Chưa cần bật email link/passwordless, Google hoặc Phone.
3. Trong **Authentication → Settings → Authorized domains**, kiểm tra có `localhost`. Project mới có thể chưa có; thêm `localhost` để phát triển cục bộ. Nếu chạy qua `127.0.0.1`, thêm domain này khi Console cho phép, hoặc truy cập bằng `http://localhost:5173`.

Task này chỉ bật nhà cung cấp; bấm đăng ký/đăng nhập trên website vẫn chưa gửi yêu cầu tạo tài khoản.

## 4. Tạo Cloud Firestore và khóa quyền

1. Vào **Firestore Database → Create database**.
2. Nếu cần chọn edition, chọn **Standard edition**, dùng database mặc định `(default)`.
3. Chọn vị trí gần Việt Nam, ví dụ Singapore `asia-southeast1` nếu có. Vị trí này khó thay đổi về sau nên kiểm tra trước khi xác nhận.
4. Chọn **Production mode**, không chọn Test mode mở dữ liệu công khai. Nếu được yêu cầu thanh toán, kiểm tra lại đang chọn đúng Standard/default và chưa chuyển qua dịch vụ khác.
5. Trong tab **Rules**, dán nội dung từ `firebase/firestore.rules` rồi bấm **Publish**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Đây là khóa tạm thời: mọi truy cập từ ứng dụng web đều bị từ chối, kể cả người đã đăng nhập. Admin Console vẫn quản lý được dữ liệu theo quyền tài khoản Google. Các task tiếp theo sẽ mở đúng quyền cần thiết kèm kiểm tra; không sửa thành `if true` để bỏ qua lỗi.

Để kiểm tra trên project thật: dùng **Rules Playground** thử `get` và `create` vào `/users/test`, cả không đăng nhập lẫn UID thử; kết quả đều phải bị từ chối. File Rules trong máy không tự triển khai lên Firebase: phải Publish trong Console hoặc dùng CLI sau này.

## 5. Điền cấu hình vào máy

Mở PowerShell tại thư mục dự án:

```powershell
Copy-Item .env.example .env.local
```

Chỉ chạy lệnh copy nếu chưa có `.env.local`, tránh ghi đè cấu hình đã điền. Mở `.env.local` và thay bằng giá trị thật của Web App:

```dotenv
VITE_FIREBASE_API_KEY=gia_tri_apiKey
VITE_FIREBASE_AUTH_DOMAIN=gia_tri_authDomain
VITE_FIREBASE_PROJECT_ID=gia_tri_projectId
VITE_FIREBASE_APP_ID=gia_tri_appId
```

Không sao chép nguyên các chữ `gia_tri_...`. Không đặt mật khẩu hoặc khóa máy chủ trong biến `VITE_*`: những biến này được đóng gói vào giao diện trình duyệt. `.env.local` đã được loại khỏi Git; Security Rules mới là lớp bảo vệ dữ liệu.

Kiểm tra:

```powershell
npm run check:firebase
npm test
npm run build
```

`check:firebase` chỉ kiểm tra đủ biến và đúng định dạng, không gửi yêu cầu mạng, không chứng minh project tồn tại hoặc dịch vụ hoạt động. Không in nội dung khóa ra terminal.

Dừng dev server bằng Ctrl+C rồi chạy lại `npm run dev` để nạp cấu hình mới. Trang web báo “Đã có cấu hình Firebase; chưa xác minh kết nối máy chủ” khi định dạng hợp lệ, không báo kết nối thành công chỉ dựa trên việc có apiKey.

## Hoàn thành task 2 khi nào?

- Project thật ở Spark, Web App đã đăng ký.
- Email/Password bật, database Standard mặc định được tạo.
- Quy tắc khóa ban đầu được Publish và thử bị từ chối trong Playground.
- `.env.local` chứa cấu hình đúng project; kiểm tra cục bộ đạt.
- Sau khi có project, trợ lý và bạn kiểm chứng dịch vụ thật trước khi đánh dấu hoàn thành; nếu chưa có cấu hình thì mới là chuẩn bị mã kết nối.

Chưa tạo tài khoản thật, chưa tạo tài khoản admin; hai phần đó thuộc các task sau. Không cần Cloud Functions, Cloud Storage hay billing.

## Tài liệu chính thức

- [Thiết lập Firebase cho web](https://firebase.google.com/docs/web/setup)
- [Firebase Authentication cho web](https://firebase.google.com/docs/auth/web/start)
- [Bắt đầu Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Gói Spark và hạn mức miễn phí](https://firebase.google.com/pricing)
