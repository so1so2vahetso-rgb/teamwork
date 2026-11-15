# Task 6 — Thành viên thuộc nhiều nhóm

## Phạm vi đã triển khai

- Admin mở Quản lý nhóm → Thành viên trên từng thẻ nhóm.
- Tìm tài khoản bằng chính xác email đã đăng ký và hoàn tất hồ sơ, thêm vào nhóm hoặc xóa khỏi nhóm qua bước xác nhận. Không tạo tài khoản thay người dùng.
- Một tài khoản có thể ở nhiều nhóm. Xóa khỏi A không xóa tài khoản hoặc ảnh hưởng B.
- Thêm trùng bị chặn; thêm lại sau xóa được phép và giữ lịch sử phiên bản.
- Thành viên mở Nhóm của tôi; chỉ thấy nhóm đang tham gia và tên người cùng nhóm, không có nút sửa nhóm/thêm/xóa thành viên.
- Không lộ email người cùng nhóm: membership chỉ lưu UID/tên hiển thị, không lưu email. Email tìm kiếm thuộc màn hình admin.
- Danh sách cập nhật realtime. Khi bị xóa khỏi nhóm hoặc nhóm bị lưu trữ, dữ liệu nhóm bị bỏ khỏi giao diện, cửa sổ thành viên đang xem đóng lại.
- Chưa triển khai công việc (task 7).

## Dữ liệu và quyền

- `groups/{groupId}/members/{uid}`: UID, groupId, tên, active, version, joinedAt, updatedAt, updatedBy và openTaskCount.
- `users/{uid}/groupRefs/{groupId}`: UID/groupId/active/version, chỉ để chính người đó tìm các nhóm của mình; không chứa tên/email đồng nghiệp.
- Thêm/xóa ghi membership, groupRef và activityLog trong cùng transaction. Rules kiểm tra liên kết tài liệu trước/sau, actor, timestamp, phiên bản, hồ sơ có thật và nhóm còn hoạt động. Không thể tạo ref/log rời hay sửa trực tiếp membership mà bỏ các phần liên quan.
- Admin đọc/tìm hồ sơ tài khoản. Thành viên vẫn chỉ đọc hồ sơ cá nhân của mình; không liệt kê users.
- Xóa thành viên là active false, không xóa lịch sử. Chặn xóa khi openTaskCount > 0 kể cả dùng SDK trực tiếp; task 7 phải cập nhật bộ đếm này nguyên tử cùng thay đổi công việc. Hiện chưa có công việc nên thành viên mới có bộ đếm 0, không hiển thị số công việc giả trong UI.
- Không dùng collectionGroup hoặc index phức hợp: truy vấn groupRefs của chính người dùng, sau đó listener từng nhóm được phép đọc. Hủy listener khi không còn ref/rời trang. Với quy mô lớn cần phân trang/giới hạn listener; hiện phục vụ nhóm đồ án nhỏ.

## Publish Rules và thử project thật

1. Mở file `firebase/firestore.rules`, sao chép toàn bộ, không copy một phần đang nhìn thấy.
2. Vào Firestore → Rules, bấm trong vùng mã, Ctrl+A rồi Ctrl+V để thay toàn bộ mã cũ.
3. Bản task 6 có match /groups/{groupId}/members/{uid}, validMember và groupRefs. Bấm Publish.
4. Nếu báo mismatched input EOF, kiểm tra đã dán đủ đến dấu ngoặc đóng cuối file. Bản hiện tại khoảng 150 dòng; file cục bộ đã được emulator biên dịch/kiểm tra. Không tự xóa ngoặc hay mở if true để xử lý lỗi do copy thiếu.
5. Tải lại website, đăng nhập admin → Quản lý nhóm → Thành viên → nhập email tài khoản đã đăng ký → Tìm tài khoản → Thêm vào nhóm.
6. Đăng nhập tài khoản thành viên bằng trình duyệt/phiên riêng → Nhóm của tôi; thử một người ở A và B. Admin xóa khỏi A thì A biến mất, B còn nguyên.

CLI chưa được đăng nhập quyền quản lý project nên người dùng tự Publish; file trong máy không tự cập nhật Console. Không nâng cấp Spark, không gắn thẻ hoặc thêm dịch vụ trả phí. Chưa tự tạo tài khoản hoặc membership thử trong production.

## Kiểm tra

- 20 bài emulator integration/Rules và 5 unit test; 6 bài membership mới kiểm tra nhiều nhóm, quyền/riêng tư, remove/re-add, stale/duplicate/nonexistent account, archived groups, giả ref/log và chặn xóa người còn công việc.
- Chrome hai browser context độc lập: tài khoản admin/thành viên thật trên emulator, thêm vào A/B, xem danh sách chỉ đọc, hủy/xác nhận xóa, quyền bị thu hồi làm đóng dialog, thêm lại, chặn trùng, reload và mobile 320/375px.
- Không có production request hoặc lỗi JavaScript trong QA; đã xem ảnh desktop/mobile. Rà soát độc lập không phát hiện lỗi quan trọng.
- Build thành công; cảnh báo chunk SDK lớn vẫn được giữ để tối ưu ở task hoàn thiện.

Task 6 hoàn thành phần mã/kiểm tra cục bộ; cần Publish và dùng tài khoản của người dùng để xác nhận project thật.
