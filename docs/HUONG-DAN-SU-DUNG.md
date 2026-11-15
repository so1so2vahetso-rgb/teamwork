# Hướng dẫn TeamWork — bản cuối

Website: https://teamworl-3021a.web.app

## Tài khoản và admin

Mỗi người tự đăng ký email/mật khẩu. Tài khoản có UID 7lMpHrrC01PzqfdR2txtPUYNlhF2 là admin duy nhất. Các tài khoản khác là thành viên và chờ admin thêm vào nhóm. Không cần tạo document admin hoặc sửa role bằng tay.

## Admin sử dụng

1. Vào Nhóm làm việc, tạo nhóm A và B.
2. Mở Thành viên; tìm đúng email đã đăng ký rồi thêm. Cùng người có thể thuộc cả A và B.
3. Mở Công việc của nhóm, tạo tiêu đề/mô tả, chọn một người phụ trách và hạn chót.
4. Chỉnh sửa để đổi nội dung, hạn hoặc giao lại. Lưu trữ để bỏ khỏi danh sách hoạt động, giữ lịch sử.
5. Xem Tổng quan để theo dõi tiến độ, Lịch sử để biết người thực hiện/thao tác/thời điểm. Tải thêm để xem hoạt động cũ.

Không xóa được thành viên còn việc chưa hoàn thành. Hãy hoàn thành, giao lại hoặc lưu trữ các việc đó trước. Lưu trữ nhóm chặn thành viên truy cập nhóm đó. Bản này không có giao diện khôi phục lưu trữ.

## Thành viên sử dụng

1. Mở Công việc của tôi hoặc nhóm mình được thêm vào.
2. Chọn trạng thái việc được giao: Chưa làm, Đang làm, Hoàn thành. Hoàn thành lưu ngay; được chuyển ngược khi cần.
3. Người cùng nhóm sẽ nhận thay đổi qua listener thời gian thực, không cần F5.

Thành viên xem được việc của người cùng nhóm, nhưng không sửa nội dung/người phụ trách hoặc trạng thái việc của người khác. Không có quyền quản lý nhóm, thành viên hoặc lịch sử. Firestore kiểm tra quyền ngay cả khi người dùng tự sửa giao diện.

## Tiến độ và bộ lọc

Chuyển Bảng trạng thái/Danh sách để đổi cách xem. Tìm tên không dấu vẫn khớp tiếng Việt có dấu. Kết hợp nhóm, người phụ trách, trạng thái và chỉ quá hạn. Số liệu tính theo phạm vi đang lọc; danh sách trống có tỷ lệ 0%.

Quá hạn theo ngày Việt Nam: qua ngày hạn chót mà chưa hoàn thành. Việc hoàn thành không gắn nhãn quá hạn.

## Demo khoảng 5 phút

1. Mở hai phiên trình duyệt độc lập, ví dụ cửa sổ thường cho admin và ẩn danh cho thành viên. Hai tab chung phiên không dùng đồng thời hai tài khoản khác nhau.
2. Tạo A/B, thêm cùng thành viên vào cả hai để thể hiện quan hệ nhiều–nhiều.
3. Tạo ba việc, giao một việc cho thành viên. Đặt một hạn trong quá khứ để thử quá hạn.
4. Thành viên đổi việc được giao sang Đang làm rồi Hoàn thành; quan sát admin tự cập nhật.
5. Thử bảng/danh sách, tìm kiếm, bộ lọc và tỷ lệ hoàn thành.
6. Admin xem lịch sử vừa ghi. Thành viên không có điều hướng lịch sử hoặc nút quản trị.
7. Thử xóa thành viên còn việc: bị chặn. Giao lại/hoàn thành việc rồi xóa; phiên thành viên mất quyền nhóm.

Dữ liệu thử tự động nằm trong emulator. Demo website thật cần tự tạo dữ liệu phù hợp; không đưa mật khẩu vào ảnh báo cáo.

## Giải thích phần Hệ phân tán

React chạy trên nhiều trình duyệt cùng dùng Authentication và Cloud Firestore trên đám mây. Firebase vận hành hạ tầng cơ sở dữ liệu phân tán; đồ án sử dụng dịch vụ đó, không tự xây các nút cơ sở dữ liệu.

Listener onSnapshot nhận thay đổi và cập nhật các client. Giao dịch ghi task, bộ đếm việc và lịch sử cùng nhau để tránh lưu một phần. Version phát hiện dữ liệu đã bị người khác thay đổi trước khi lưu. Security Rules kiểm tra quyền/dữ liệu ở máy chủ; server timestamp ghi thời điểm máy chủ.

Trình bày ba vấn đề: đồng bộ client, thay đổi đồng thời và kiểm soát quyền dữ liệu dùng chung. Demo hai phiên chứng minh đồng bộ giao diện; không phải bằng chứng tự xây cơ chế sao chép database.

## Lỗi thường gặp

- Localhost không mở: nhấp START-WEBSITE.cmd và giữ cửa sổ chạy, hoặc dùng link Hosting.
- Không thấy nhóm: admin cần thêm đúng email đã đăng ký.
- Xóa thành viên bị chặn: kiểm tra việc chưa hoàn thành còn giao cho người đó.
- Dữ liệu đã thay đổi: tải bản mới rồi sửa lại.
- Mất mạng: kết nối lại trước khi ghi.
- Đăng ký email chưa bật: bật Email/Password trong Authentication.
- Deploy thiếu quyền: dùng đúng Google quản lý project rồi chạy npm run deploy.

Gói Spark có hạn mức miễn phí; không cần nâng cấp Blaze cho các chức năng này.
