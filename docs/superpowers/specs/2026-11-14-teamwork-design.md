# Thiết kế website quản lý công việc nhóm

Trạng thái: Đã triển khai theo các lần người dùng yêu cầu tiếp tục. Ngày 14/11/2026 người dùng đổi từ làm từng task sang hoàn thiện toàn bộ và xem kết quả cuối. Hướng dẫn hiện tại: docs/HUONG-DAN-SU-DUNG.md.

## Mục đích

Đồ án môn Hệ phân tán: website tiếng Việt chạy được, giao diện dễ dùng, có luồng quản lý công việc hoàn chỉnh. Người dùng mới học lập trình. Ưu tiên sản phẩm thực sự sử dụng được và giải thích được khi bảo vệ đồ án.

## Những yêu cầu người dùng đã chốt

- Không tốn chi phí: Firebase Spark, không liên kết phương thức thanh toán, không nâng cấp Blaze.
- Một admin duy nhất quản lý toàn bộ nhóm, thành viên và công việc.
- Thành viên tự đăng ký bằng email, mật khẩu. Admin thêm tài khoản đã đăng ký vào nhóm.
- Một người tham gia nhiều nhóm; một nhóm có nhiều người.
- Mỗi công việc thuộc một nhóm và giao cho đúng một thành viên của nhóm đó.
- Admin tạo, xem, sửa, xóa, phân công công việc và đặt hạn chót.
- Thành viên xem tất cả công việc trong các nhóm mình tham gia; chỉ đổi trạng thái công việc được giao cho chính mình.
- Ba trạng thái: Chưa làm, Đang làm, Hoàn thành. Chọn Hoàn thành có hiệu lực ngay, không cần duyệt.
- Chỉ admin xem lịch sử hoạt động; hệ thống tự ghi, không cho sửa/xóa trực tiếp lịch sử.
- Bố cục ban đầu: điều hướng bên trái, chọn nhóm, thống kê, bảng ba cột và tùy chọn danh sách. Admin có trang nhóm/thành viên và lịch sử; thành viên có Công việc của tôi.

## Các hướng đã cân nhắc

1. HTML/CSS/JavaScript + Firebase: ít công cụ, nhưng ứng dụng nhiều màn hình dễ khó quản lý.
2. React + JavaScript + Vite + Firebase: cần học React, đổi lại dễ chia giao diện và quản lý trạng thái. Đây là hướng đề xuất và được người dùng đồng ý tiếp tục với Firebase Spark.

Về phạm vi: bản cốt lõi hoặc bản có thêm lịch sử hoạt động. Người dùng chọn thêm lịch sử, chỉ admin được xem.

## Phạm vi và màn hình

- Đăng nhập, đăng ký, đăng xuất; báo lỗi bằng tiếng Việt.
- Tài khoản mới chưa có nhóm: hiển thị chờ admin thêm vào nhóm, không có dữ liệu nhóm khác.
- Công việc nhóm: bảng trạng thái và danh sách; lọc theo nhóm, trạng thái, người phụ trách; tìm theo tiêu đề.
- Công việc của tôi: những việc được giao trong các nhóm đang tham gia; mặc định gom tất cả nhóm, có thể lọc một nhóm.
- Admin quản lý nhóm và danh sách tài khoản đã đăng ký, thêm/xóa quan hệ thành viên.
- Form công việc: tiêu đề, mô tả, nhóm, một người phụ trách, hạn chót; trạng thái mặc định Chưa làm.
- Thống kê theo phạm vi đang xem: tổng số việc, số việc mỗi trạng thái, tỷ lệ hoàn thành. Quá hạn là nhãn bổ sung, không phải trạng thái thứ tư.
- Lịch sử admin: người thực hiện, thao tác, đối tượng và thời điểm; có phân trang.

## Các quyết định đề xuất để hoàn thiện thiết kế

Những điểm dưới đây do người thiết kế đề xuất, chưa phải yêu cầu riêng do người dùng nêu:

- Thành viên được chuyển ngược trạng thái khi thao tác nhầm hoặc cần làm tiếp.
- Hạn chót là ngày theo Asia/Ho_Chi_Minh; quá hạn khi qua ngày đó mà chưa hoàn thành.
- Tài khoản admin được tạo trước bằng Firebase Console; UID admin được thiết lập trong quy tắc bảo mật và cấu hình giao diện. Không có form tự chọn vai trò hay API nâng quyền.
- Mật khẩu chỉ do Firebase Authentication xử lý, không lưu trong Firestore.
- Thành viên không được đọc danh sách toàn bộ tài khoản. Chỉ đọc hồ sơ cơ bản của người cùng nhóm; email tài khoản hiển thị cho chính chủ và admin.
- Không xóa tài khoản Firebase Authentication qua giao diện admin. Admin chỉ xóa người khỏi nhóm.
- Nếu một người còn công việc chưa hoàn thành trong nhóm, admin phải giao lại các việc đó trước khi xóa người khỏi nhóm. Công việc đã hoàn thành giữ tên người phụ trách tại thời điểm ghi nhận.
- Xóa công việc/nhóm là lưu trữ mềm, có hộp xác nhận; công việc của nhóm bị lưu trữ không hiện trong danh sách đang hoạt động. Không thực hiện xóa hàng loạt tốn thao tác dữ liệu.
- Khi chưa có mạng, hiển thị mất kết nối và không nhận thao tác thay đổi dữ liệu; không hứa hẹn đồng bộ chỉnh sửa ngoại tuyến.

## Kiến trúc và dữ liệu

Giao diện React giao tiếp với Firebase Authentication và Cloud Firestore qua SDK web. Firebase Hosting phục vụ bản build Vite. Không cần backend riêng cho phạm vi này.

Dữ liệu dự kiến:

- users/{uid}: hồ sơ cá nhân, thông tin tài khoản tối thiểu; quyền đọc giới hạn.
- groups/{groupId}: tên, mô tả, trạng thái lưu trữ, thời gian tạo/cập nhật.
- groups/{groupId}/members/{uid}: UID, tên hiển thị, thời gian tham gia; đồng thời dùng làm hồ sơ công khai trong nhóm.
- groups/{groupId}/tasks/{taskId}: nội dung, assigneeId, tên người phụ trách được lưu kèm, dueDate, status, version, createdAt, updatedAt, updatedBy, archived.
- activityLogs/{eventId}: actorId, loại thao tác, đối tượng, thay đổi liên quan, thời gian máy chủ.

Tên collection và chỉ mục cụ thể để người triển khai quyết định. Cần thiết kế truy vấn và Security Rules cùng lúc; không đọc toàn bộ dữ liệu rồi lọc quyền ở giao diện. Truy vấn Công việc của tôi phải giới hạn vào nhóm người dùng đang tham gia và tải theo trang khi cần.

## Phân quyền và lịch sử đáng tin cậy

Security Rules là nơi thực thi quyền; ẩn nút chỉ phục vụ giao diện.

- Chỉ UID admin đã cấu hình được sửa nhóm, quan hệ thành viên, nội dung và phân công công việc.
- Đăng ký chỉ cho phép tạo hồ sơ của chính UID đăng nhập, không tạo quyền admin.
- Đọc nhóm/công việc cần là admin hoặc thành viên nhóm đang hoạt động.
- Thành viên cập nhật công việc phải đồng thời còn thuộc nhóm và là người phụ trách. Chỉ cho sửa status cùng các trường kỹ thuật được xác thực; không được đổi nội dung, hạn chót, người phụ trách hay trường lưu trữ.
- Thay đổi đối tượng quản lý và ghi lịch sử phải thực hiện nguyên tử bằng transaction/batch phù hợp. Rules kiểm tra sự tương ứng giữa thay đổi và bản ghi lịch sử, người thực hiện, thời gian, phiên bản; không cho client giả danh người khác hoặc sửa dữ liệu mà bỏ ghi lịch sử.
- Lịch sử chỉ admin đọc; việc tạo log bị ràng buộc với thao tác hợp lệ; không cho sửa/xóa log, kể cả qua giao diện admin.
- Khi hai người thao tác cùng một công việc, kiểm tra phiên bản; nếu dữ liệu đã thay đổi, thông báo tải lại thay vì ghi đè âm thầm.
- Kiểm tra các quyền bằng Firebase Emulator trước khi sử dụng cơ sở dữ liệu thật.

## Giới hạn chi phí và ngoài phạm vi

Chỉ dùng các tính năng khả dụng trong Spark và hạn mức miễn phí. Không bảo đảm sử dụng không giới hạn. Nếu chạm hạn mức, thông báo dịch vụ tạm thời bị giới hạn; không tự nâng cấp.

Không dùng Cloud Functions, Cloud Storage, SMS, email mời tự động, AI, chat, gọi video, tên miền mua riêng hoặc Firebase App Hosting. Không tải tệp đính kèm. Avatar dùng chữ cái tên. Hủy realtime listener khi đổi màn hình, chỉ nghe dữ liệu đang cần và phân trang lịch sử.

## Minh họa môn Hệ phân tán

Mở admin và thành viên ở hai phiên trình duyệt riêng: admin giao việc, thành viên thấy cập nhật; thành viên đổi trạng thái, admin thấy thay đổi và lịch sử. Kiểm tra người ngoài nhóm không đọc được dữ liệu, thành viên không sửa được nội dung và hai phiên cập nhật đồng thời không âm thầm ghi đè.

Phân biệt rõ đây là ứng dụng sử dụng dịch vụ dữ liệu do Firebase quản lý, không phải tự cài đặt thuật toán sao chép hay tự vận hành nhiều nút cơ sở dữ liệu. Người dùng chưa cung cấp rubric môn học; cần đối chiếu với rubric khi có.

## Điều kiện nghiệm thu

1. Chạy cục bộ được từ hướng dẫn dành cho người mới; cấu hình Firebase được mô tả từng bước.
2. Đăng ký, đăng nhập, đăng xuất và trạng thái chưa có nhóm hoạt động đúng.
3. Admin quản lý được hai nhóm; một tài khoản thuộc cả hai; người ngoài nhóm không truy cập dữ liệu.
4. Giao một người, CRUD công việc, lọc và ba trạng thái hoạt động; thành viên không sửa việc người khác.
5. Hoàn thành có hiệu lực ngay; thống kê và realtime phản ánh đúng phạm vi.
6. Lịch sử tự ghi, chỉ admin đọc và không thể bị giả mạo qua SDK trong các kiểm tra quyền quan trọng.
7. Giao diện không vỡ ở máy tính và điện thoại; có trạng thái đang tải, trống, lỗi, mất kết nối, xác nhận xóa.
8. Triển khai Firebase Hosting bằng Spark, không yêu cầu bật thanh toán.

## Để người triển khai quyết định

Chi tiết tổ chức mã nguồn, thư viện định tuyến, chỉ mục/truy vấn, cách tạo event ID và xác thực liên kết log trong Rules, thông báo, màu sắc và giãn cách, bộ dữ liệu demo và các kiểm tra cần thiết. Ưu tiên ít phụ thuộc, dễ giải thích và không thêm dịch vụ trả phí.
