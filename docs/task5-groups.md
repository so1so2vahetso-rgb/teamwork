# Task 5 — Quản lý nhóm dành cho admin

## Đã triển khai

- Admin vào trang tài khoản và bấm Quản lý nhóm để mở không gian quản trị.
- Danh sách nhóm đang hoạt động lấy từ Firestore, đồng bộ giữa các tab; không dùng nhóm minh họa làm dữ liệu thật.
- Tạo nhóm có tên bắt buộc (1–80 ký tự sau bỏ khoảng trắng đầu/cuối), mô tả tùy chọn tối đa 500 ký tự. Cho phép tên trùng vì chưa có yêu cầu tên duy nhất.
- Sửa tên và mô tả; phát hiện phiên bản cũ để không ghi đè thay đổi của phiên khác.
- Lưu trữ nhóm qua hộp xác nhận. Đây là xóa mềm: ẩn khỏi danh sách đang hoạt động, giữ tài liệu và lịch sử; chưa có thao tác khôi phục.
- Loading, danh sách trống, thông báo lỗi/thành công, dialog hỗ trợ bàn phím/Escape và giao diện điện thoại.
- Khóa thao tác khi offline hoặc chưa xác nhận dữ liệu từ server. Transaction có bước đọc server để không xếp thao tác ghi vào hàng chờ ngoại tuyến.
- Hủy listener khi rời trang; lỗi quyền xóa danh sách cũ và đóng dialog.

## Bảo mật và lịch sử

Firestore Rules chỉ cho UID admin đã chọn đọc/tạo/sửa nhóm. Thành viên/khách chưa được đọc nhóm ở task 5; quan hệ thành viên và quyền đọc đúng nhóm thuộc task 6.

Mỗi mutation nhóm cùng ghi activityLogs trong một transaction. Log ID `group_{groupId}_{version}`; Rules kiểm tra tài liệu trước/sau, actor, thời gian máy chủ, tên nhóm, phiên bản và hành động. Không cho bỏ log, tạo log rời, sửa hoặc xóa log; chỉ admin được đọc. Màn hình lịch sử thuộc task 10, nhưng dữ liệu lịch sử đã được ghi từ task này để không mất dấu thay đổi.

Không cho xóa cứng nhóm hay sửa nhóm đã lưu trữ. Dữ liệu gồm name, description, archived, version, createdBy, updatedBy, createdAt, updatedAt. Chưa có số thành viên hoặc số công việc giả trong giao diện.

## Publish Rules task 5

File trong máy đã thay đổi, nhưng không tự cập nhật lên project thật. Trợ lý chưa có tài khoản CLI được cấp quyền, nên người dùng tự Publish:

1. Mở `firebase/firestore.rules` trong thư mục dự án, Ctrl+A → Ctrl+C.
2. Vào [Firestore Rules](https://console.firebase.google.com/project/teamworl-3021a/firestore/databases/-default-/security/rules).
3. Bấm trong vùng mã, Ctrl+A → Ctrl+V để thay toàn bộ. Không dán nối vào mã cũ.
4. Kiểm tra ngoài phần UID admin còn có `match /groups/{id}` và `match /activityLogs/{logId}`.
5. Bấm Publish, chờ thành công.

Không cần đổi trường role, tạo collection thủ công, thêm index phức hợp hoặc nâng cấp thanh toán. Mọi collection sẽ được ứng dụng tạo khi lưu thành công.

## Thử trên project thật

1. Mở website cục bộ http://127.0.0.1:5173, Ctrl+R, đăng nhập tài khoản admin.
2. Tại nhãn Quản trị viên, chọn Quản lý nhóm.
3. Tạo Nhóm A và Nhóm B. Kiểm tra đúng tên/mô tả xuất hiện; F5 rồi mở lại Quản lý nhóm vẫn có dữ liệu.
4. Sửa mô tả một nhóm; thử Lưu trữ một nhóm không cần dùng. Hộp xác nhận có nút Hủy để không thực hiện.
5. Trong Firestore Data, groups chứa tài liệu nhóm; activityLogs có sự kiện tương ứng. Nhóm lưu trữ có archived true, không bị xóa khỏi database.

Chưa thêm người hoặc tạo công việc ở task này. Không tự tạo nhóm mẫu trên project thật bằng công cụ của trợ lý; người dùng tự thử các nhóm muốn giữ.

## Kết quả kiểm tra cục bộ

- 5 unit test hiện có vẫn đạt.
- 14 emulator integration/rules test đạt, gồm 5 test mới cho nhóm và lịch sử.
- Chrome: empty state, tạo/sửa/lưu trữ/hủy, cập nhật giữa 2 tab, từ chối sửa phiên bản cũ, tải lại, offline khóa ghi và responsive 320/375/768/1440px.
- Đã xem ảnh desktop/mobile; không có lỗi JS hoặc request production trong QA emulator.
- Rà soát độc lập không phát hiện lỗi quan trọng. Production vẫn cần người dùng Publish Rules và thử tạo nhóm thật trước khi xác nhận hoàn thành.

## Chi phí

Tiếp tục Spark, không bật billing. Mỗi thay đổi dùng thêm một log và các lượt đọc kiểm tra/transaction, nằm trong hạn mức Firestore của project. Listener chỉ hoạt động khi ở màn hình nhóm; task này chưa phân trang danh sách nhóm vì quy mô đồ án nhỏ. Cảnh báo chunk SDK từ task trước chưa được tối ưu trong phạm vi này.
