# Task 4 — Đăng nhập, đăng xuất và nhận diện admin

## Phạm vi

- Đăng nhập thật bằng email và mật khẩu; lỗi thông tin đăng nhập dùng thông báo chung, không tiết lộ email nào đã tồn tại.
- SDK giữ phiên cục bộ để tải lại trang hoặc mở tab cùng trình duyệt vẫn nhận diện tài khoản.
- Đăng xuất xóa phiên Firebase và nội dung tài khoản trên giao diện. Các tab cùng nguồn nhận thông báo BroadcastChannel để chủ động xóa phiên; thông báo không chứa UID, mật khẩu hoặc token. Trình duyệt không hỗ trợ BroadcastChannel dùng cơ chế đồng bộ gốc của Firebase.
- Tài khoản chưa có hồ sơ vẫn có thể hoàn tất hồ sơ bằng luồng khôi phục task 3 sau khi đăng nhập.
- Admin duy nhất do người dùng chọn có UID `7lMpHrrC01PzqfdR2txtPUYNlhF2`.
- Không triển khai quản lý nhóm/công việc trong task 4.

## Cách admin được xác định

UID này nằm trong `.env.local` (`VITE_FIREBASE_ADMIN_UID`) để giao diện biết tài khoản cần kiểm tra. Quyền thực được xác nhận bởi Firestore Rules, không dựa trên trường role có thể bị sửa ở trình duyệt.

Hàm `isAdmin()` trong `firebase/firestore.rules` so UID đăng nhập với đúng một UID đã chọn. Đường dẫn `access/admin` chỉ cho UID đó thực hiện get, không cho list/write. Giao diện gọi `getDocFromServer` tại đường dẫn đó: chỉ khi máy chủ chấp nhận yêu cầu đọc mới hiển thị Quản trị viên. Tài liệu không cần tồn tại; **không tạo collection access hoặc tài liệu admin thủ công**.

Thành viên thay đổi cấu hình UID cục bộ vẫn không qua được kiểm tra Rules. Nếu UID giao diện khớp nhưng bản Rules chưa cập nhật thì giao diện giữ quyền thành viên và hiện hướng dẫn Publish rồi Kiểm tra lại quyền. Mất mạng/lỗi tải quyền không cấp quyền admin.

Trường `role: member` trong hồ sơ lúc đăng ký vẫn giữ nguyên. Không sửa trường này thành admin, không thêm mục chọn vai trò ở form đăng ký. Sau này các chức năng quản lý sẽ dùng cùng `isAdmin()` để cấp quyền đúng phạm vi.

## Thao tác trên Firebase Console

1. Mở file `firebase/firestore.rules`, sao chép toàn bộ.
2. Vào [Firestore → Rules](https://console.firebase.google.com/project/teamworl-3021a/firestore/databases/-default-/security/rules), bấm vào trình soạn thảo, Ctrl+A rồi Ctrl+V.
3. Kiểm tra có hàm isAdmin() chứa đúng UID nêu trên, bấm Publish và chờ thành công. Chỉ dán mà chưa Publish thì chưa có hiệu lực.
4. Mở website cục bộ (mặc định http://127.0.0.1:5173), Ctrl+R để nạp cấu hình mới.
5. Đăng nhập bằng email/mật khẩu của tài khoản có UID đã chọn. Không gửi mật khẩu trong chat. Màn hình phải có nhãn Quản trị viên.
6. Nếu đang đăng nhập sẵn mà thấy thông báo quyền chưa xác nhận, chọn Kiểm tra lại quyền sau khi Publish.

CLI của trợ lý chưa được đăng nhập tài khoản Google quản lý project nên không tự Publish hoặc đọc nguồn Rules production. Dựa vào server role check của website để xác nhận, không khẳng định đã kiểm tra Rules production từ file cục bộ.

## Thử nghiệm thủ công

- Admin đăng nhập: hiển thị tên, email và nhãn Quản trị viên; chưa có nút quản lý nhóm vì task 5 chưa làm.
- Thành viên đăng nhập: nhãn Thành viên và thông báo chờ được thêm nhóm.
- Nhập sai mật khẩu: báo lỗi tiếng Việt, không mở màn hình tài khoản.
- F5: giữ đúng người dùng/quyền; Đăng xuất rồi F5: vẫn là trang đăng nhập.
- Hai tab cùng địa chỉ: đăng xuất ở một tab thì tab kia cũng về đăng nhập. Hai địa chỉ localhost và 127.0.0.1 là hai nguồn khác nhau, không dùng lẫn khi thử đồng bộ tab.
- Phiên lưu bởi SDK có thể tồn tại khi đóng/mở trình duyệt. Không tự lưu mật khẩu; đăng xuất khi dùng máy chung.

## Kiểm tra cục bộ

`npm test`: cấu hình Firebase và ánh xạ vai trò theo UID.

`npm run test:rules`: Auth/Firestore Emulator demo-teamwork; đăng ký task 3, từ chối truy cập trái quyền, đăng nhập sai/đúng, đăng xuất và xác thực admin trên server. Không gọi project thật.

Browser smoke trên Chrome: admin/thành viên, đăng ký hồi quy, reload, nhiều tab, mobile, sai mật khẩu và kiểm tra không có yêu cầu production. QA thay UID admin trên emulator thành emulator-admin, không thay file Rules production.

Giữ Spark; không thêm dịch vụ trả phí hoặc nâng cấp billing. Cảnh báo chunk SDK và phụ thuộc phát triển CLI đã ghi từ task 3, chưa mở rộng sang tối ưu giao diện ở task này.

## Tham khảo

- [Firebase Auth persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)
- [Firebase Auth state observer](https://firebase.google.com/docs/auth/web/start)
- [Security Rules theo UID](https://firebase.google.com/docs/firestore/security/rules-conditions)
