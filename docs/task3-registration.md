# Task 3 — Đăng ký tài khoản và hồ sơ thành viên

## Đã triển khai

- Tab Đăng ký gọi Firebase Authentication thật bằng email/mật khẩu.
- Sau khi tạo tài khoản, lưu `users/{uid}` trong Firestore: `uid`, `email`, `displayName`, `role: member`, `createdAt` từ máy chủ.
- Không lưu mật khẩu trong Firestore hoặc biến môi trường. Firebase SDK quản lý phiên tài khoản; mật khẩu không được ứng dụng tự ghi vào localStorage/sessionStorage.
- Tên được bỏ khoảng trắng hai đầu; chặn tên trống, email sai, mật khẩu dưới 6 ký tự và xác nhận không khớp.
- Vô hiệu hóa form/chuyển tab trong khi gửi và chặn gửi lặp.
- Chỉ báo tài khoản sẵn sàng sau khi xác nhận hồ sơ đã có trên máy chủ. Hiện thông báo chờ admin thêm vào nhóm.
- Báo lỗi email trùng, mạng, quyền Firestore và nhà cung cấp Email/Password chưa bật bằng tiếng Việt.

## Một lần thao tác cần làm trên Console

Trợ lý chưa có phiên đăng nhập Firebase CLI của tài khoản Google quản lý project, nên không thể tự Publish Rules trên project thật từ CLI. File cục bộ không tự cập nhật lên dịch vụ.

1. Mở [Firestore Rules của project](https://console.firebase.google.com/project/teamworl-3021a/firestore/databases/-default-/rules).
2. Mở file `firebase/firestore.rules` trong dự án. Chọn toàn bộ và sao chép.
3. Thay toàn bộ nội dung trong trình soạn thảo Rules của Console bằng nội dung vừa sao chép.
4. Bấm **Publish** và chờ thông báo thành công.

Rules task 3 chỉ cho người đã đăng nhập tạo/đọc đúng hồ sơ của chính mình; bắt buộc role member, email trùng token Auth, thời gian máy chủ, không chấp nhận trường mật khẩu hoặc trường dư. Chưa cho sửa/xóa hồ sơ, liệt kê users, đọc/ghi nhóm hoặc công việc. Không cần đổi sang Test mode hay nâng cấp Blaze.

## Cách thử trên project thật sau khi Publish

1. Chạy `npm run dev`, mở địa chỉ terminal in ra (mặc định http://127.0.0.1:5173).
2. Chọn Đăng ký, nhập tên và email do bạn kiểm soát cùng mật khẩu riêng. Không gửi mật khẩu trong chat.
3. Bấm Tạo tài khoản. Chờ thông báo tài khoản sẵn sàng.
4. Vào Firebase Console → Authentication → Users: tài khoản xuất hiện.
5. Vào Firestore → Data → users: có tài liệu ID trùng UID của tài khoản, role member và không có mật khẩu.
6. Tải lại trang: vẫn nhận diện phiên và đọc được hồ sơ của chính mình.

Đây là tài khoản thật được giữ lại để dùng đồ án, không cần tạo nhiều tài khoản thử liên tục. Chức năng đăng nhập lại và trang làm việc chưa làm ở task 3. Nút **Kết thúc phiên đăng ký** chỉ đóng phiên hiện tại; không xóa tài khoản. Sau khi đóng, cần đợi task 4 để đăng nhập lại.

## Khi tài khoản đã tạo nhưng hồ sơ chưa lưu

Auth và Firestore là hai dịch vụ, không có giao dịch chung. Nếu Rules chưa Publish hoặc mạng lỗi sau khi tạo Auth, giao diện giữ phiên để người dùng hoàn tất hồ sơ.

- Không bấm đăng ký lại cùng email: tài khoản đã tồn tại.
- Publish đúng Rules hoặc khôi phục mạng.
- Nhập tên nếu cần, bấm **Thử lưu hồ sơ**.
- Thao tác lưu lại giữ nguyên UID, không tạo Auth thứ hai và không ghi đè hồ sơ đã có.
- Phiên được Firebase SDK lưu theo cơ chế mặc định, nên cùng trình duyệt có thể phục hồi sau tải lại. Nếu xóa dữ liệu trình duyệt hoặc kết thúc phiên khi chưa xong, task 4 sẽ hỗ trợ đăng nhập lại để tiếp tục.

## Kiểm tra tự động an toàn trên máy

Yêu cầu Node 22.12+ và Java 21+ cho emulator. Máy phát triển hiện có Node 24, Java 23.

```powershell
npm test
npm run test:rules
npm run build
```

`test:rules` chạy Auth/Firestore Emulator bằng project giả `demo-teamwork`. Test từ chối chạy khi không có biến môi trường emulator, không dùng project thật và không cần đăng nhập CLI.

Để thử giao diện mà không tạo tài khoản thật, mở hai terminal:

```powershell
# Terminal 1
npm run emulators
```

```powershell
# Terminal 2
npm run dev:emulator
```

Mở http://127.0.0.1:5174. `.env.emulator` chỉ chứa cấu hình giả; mã client bắt buộc dùng `demo-teamwork` khi cờ emulator bật trong môi trường dev. Không dùng dữ liệu tài khoản thật để thử ở chế độ này.

## Giới hạn hiện tại

- Các tài khoản và hồ sơ thử tự động chỉ được tạo trong emulator; kết quả không thay thế thử nghiệm trên project thật sau Publish Rules.
- Build thành công nhưng Vite cảnh báo chunk SDK Firestore lớn hơn 500 kB. Có thể tối ưu ở task hoàn thiện.
- `npm audit --omit=dev` không báo lỗ hổng ở thời điểm triển khai. Firebase CLI hiện kéo theo 14 cảnh báo moderate trong các phụ thuộc phát triển; không dùng `audit fix --force` để hạ SDK/CLI hoặc thay đổi ngoài phạm vi. Các phụ thuộc CLI không nằm trong bản web triển khai.
