# Task 7 — Tạo, sửa, giao và lưu trữ công việc

## Cách sử dụng

1. Đăng nhập admin → Quản lý nhóm.
2. Trên thẻ nhóm, bấm Công việc.
3. Nếu chưa có thành viên, bấm Thành viên và thêm tài khoản đã đăng ký; nhóm trống không tạo/giao được việc.
4. Bấm Tạo công việc, nhập tiêu đề, mô tả tùy chọn, chọn đúng một người phụ trách và ngày hạn chót.
5. Bấm Tạo và giao việc. Chỉ báo thành công sau khi máy chủ chấp nhận.
6. Chỉnh sửa cho phép thay tiêu đề/mô tả/hạn chót/người phụ trách. Lưu trữ có bước xác nhận, ẩn công việc khỏi danh sách mà giữ dữ liệu và lịch sử.

Thành viên vào Nhóm của tôi → Công việc để xem mọi việc trong nhóm, không có nút tạo/sửa/lưu trữ. Đổi trạng thái dành cho task 8, chưa mở quyền ghi trạng thái ở task này. Việc mới mặc định Chưa làm.

## Dữ liệu

`groups/{groupId}/tasks/{taskId}` gồm title, description, assigneeId, assigneeName, dueDate (YYYY-MM-DD), status, archived, version, createdAt/By và updatedAt/By.

- Tiêu đề 1–120 ký tự sau trim; mô tả tối đa 2000 ký tự.
- Hạn chót bắt buộc là ngày có thật, kiểm tra cả client và Security Rules; không chấp nhận 30/02. Cho phép ngày quá khứ nếu cần nhập việc đã quá hạn; nhãn quá hạn/thống kê để task 9.
- Người phụ trách phải đang thuộc nhóm. Không chấp nhận danh sách nhiều người hay UID ngoài nhóm.
- Công việc có version: hai phiên sửa cùng dữ liệu, phiên cũ bị báo xung đột thay vì ghi đè.
- Không xóa cứng hoặc sửa công việc đã lưu trữ; chưa có thao tác khôi phục.

## Bộ đếm và lịch sử nguyên tử

Task, activityLog và thay đổi bộ đếm openTaskCount của thành viên được ghi trong cùng transaction. Khi tạo, người được giao tăng một việc; khi giao lại, người cũ giảm và người mới tăng; khi lưu trữ, giảm số việc còn mở. Chỉnh mô tả/tiêu đề không thay đổi bộ đếm.

Các cập nhật bộ đếm giữ version membership và groupRef vì người đó vẫn cùng quan hệ nhóm. Trường lastTaskEvent chỉ ra log mới trong cùng giao dịch; Rules tính đóng góp của công việc trước/sau để chặn sửa bộ đếm riêng, bỏ log hay dùng lại sự kiện cũ.

Không xóa khỏi nhóm người còn openTaskCount > 0. Admin cần giao lại hoặc lưu trữ các việc đó trước. Danh sách thành viên hiển thị số việc chưa hoàn thành thật.

Log task lưu tên việc, người phụ trách trước/sau, hạn chót, actor và thời gian máy chủ. Chỉ admin đọc, không sửa/xóa được. Màn hình lịch sử task 10 chưa làm; dữ liệu được giữ ngay từ task này.

## Quyền

- Admin duy nhất theo UID đã chọn được create/update/archive.
- Thành viên chỉ đọc công việc đang hoạt động trong nhóm chưa lưu trữ mà mình đang tham gia. Thành viên bị xóa khỏi nhóm mất quyền, giao diện đóng phần công việc khi nhóm biến mất.
- Không cho thành viên đổi status ở task 7. Admin cũng chưa có thao tác đổi trạng thái; update phải giữ status cũ.
- Listener task/thành viên được hủy khi rời trang. Mất quyền xóa dữ liệu cũ và đóng form. Form khóa khi gửi; offline hoặc chưa xác nhận nguồn server thì khóa thao tác lưu.

## Cập nhật Firebase thật

File `firebase/firestore.rules` đã thay đổi, cần thay toàn bộ mã trong Firestore → Rules rồi Publish. Kiểm tra có `match /groups/{groupId}/tasks/{id}` và `validTaskCounter`. Không dán một phần, không nối vào bản cũ. CLI của trợ lý chưa có quyền Google quản lý project nên không tự Publish.

Giữ nguyên UID admin, Spark và vị trí Hong Kong. Không cần collection/index thủ công, Cloud Functions, Storage, Analytics hay gắn thẻ thanh toán. Task và log được tạo bởi ứng dụng khi lưu thành công.

Sau Publish, Ctrl+R website và thử một công việc thật trong nhóm có thành viên. Mở phiên thành viên riêng để kiểm tra cùng thấy việc. Thử xóa người còn việc sẽ bị chặn; giao lại rồi xóa sẽ thành công. Chưa tự tạo dữ liệu kiểm thử trong project thật bằng công cụ trợ lý.

## Kiểm tra đã thực hiện

- Đã thấy test đỏ trước khi triển khai.
- 26 emulator integration/Rules và 5 unit test đạt, gồm 6 test task mới: tạo, đọc đúng quyền, giao lại, xung đột, lưu trữ, dữ liệu không hợp lệ và giả bộ đếm/log bằng SDK trực tiếp.
- Kiểm tra direct write ngày 30/02 với bộ payload/log đầy đủ bị Rules từ chối; task không kèm cập nhật bộ đếm cũng bị từ chối.
- Chrome qua ba tài khoản mẫu trên emulator: nhóm trống chặn tạo, giao việc, hai thành viên cùng đọc/chỉ đọc, chặn xóa người còn việc, giao lại cho người khác rồi xóa người cũ, xung đột hai tab, lưu trữ/hủy và giải phóng bộ đếm.
- Responsive tại 320/375/768/1440px, đã xem ảnh desktop/mobile; không có lỗi JavaScript hoặc request production trong QA.
- Rà soát độc lập không có lỗi quan trọng. Build đạt; cảnh báo chunk Firestore lớn vẫn để task hoàn thiện.

Chưa đánh dấu kiểm chứng project thật khi chưa Publish và thử bằng tài khoản người dùng. Dừng trước task 8.
