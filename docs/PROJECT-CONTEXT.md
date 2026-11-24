# TeamWork — ngữ cảnh để tiếp nối

Cập nhật 24/11/2026. Tài liệu này theo mã nguồn lên GitHub để phiên làm việc mới nắm được quyết định và trạng thái. HANDOFF.md là bản ghi cục bộ chi tiết, không commit; không cần tệp đó để chạy ứng dụng.

## Mục tiêu và ràng buộc

- Đồ án môn Hệ phân tán, giao diện tiếng Việt dễ dùng, sử dụng React/Vite, Firebase Authentication và Cloud Firestore.
- Người dùng mới học lập trình, cần giải thích từng bước bằng tiếng Việt.
- Giữ Firebase Spark, không gắn thẻ/nâng Blaze, không tự thêm dịch vụ hoặc API trả phí. Không cam kết uptime hoặc miễn phí vô hạn; Spark có hạn mức.
- Website hiện giữ nguyên tính năng; yêu cầu mới là lưu mã nguồn lên GitHub Private và lưu phiên bản đầu tiên. Không tự deploy hoặc thêm chức năng trong công việc sao lưu Git.

## Trạng thái ứng dụng

Website: https://teamworl-3021a.web.app. Project Firebase: teamworl-3021a. Hosting, Rules và indexes đã deploy thành công ngày 14/11/2026. Website chạy độc lập với máy phát triển.

Ngày 24/11/2026 đã cập nhật riêng Hosting: menu admin thay Công việc của tôi bằng Báo cáo tiến độ. Thành viên giữ Công việc của tôi. Báo cáo lọc theo nhóm và tuần, hiển thị việc hoàn thành trong kỳ, việc đang quá hạn và có chế độ in/lưu PDF. Giao diện có phản hồi khi bấm, chuyển mục và mở hộp thoại, theo tùy chọn giảm chuyển động của thiết bị. Đã đối chiếu trang đầu và tài nguyên giao diện trên Hosting với bản build.

Một admin duy nhất quản lý toàn bộ nhóm/công việc. UID hiện tại được cấu hình trong Rules và env; xem README. Thành viên tự đăng ký, chỉ được admin thêm vào nhóm sau đó. Quan hệ thành viên–nhóm nhiều–nhiều. Mỗi task thuộc một nhóm, giao đúng một người thuộc nhóm đó.

Thành viên đọc công việc nhóm mình và chỉ đổi trạng thái việc được giao cho mình. Admin sửa/giao lại/lưu trữ mọi task. Ba trạng thái Chưa làm, Đang làm, Hoàn thành; hoàn thành ngay, được chuyển ngược. Chỉ admin xem lịch sử bất biến, phân trang25mục.

Có Tổng quan, Công việc của tôi, bảng ba cột/danh sách, tìm tên không dấu, lọc, quá hạn theo ngày Việt Nam và tỷ lệ hoàn thành. Task, bộ đếm việc và audit log ghi nguyên tử; version phát hiện xung đột. Xóa là lưu trữ mềm, chưa có UI khôi phục. Xóa thành viên bị chặn nếu còn việc chưa hoàn thành. Mất mạng khóa ghi.

## Kiểm chứng và giới hạn

Phiên hoàn thiện ngày14/11 đã chạy8unit và30integration/Rules test đạt, build đạt, QA Chrome trên emulator với nhiều vai trò/phiên, realtime, offline, session và responsive. Không tạo dữ liệu thử production. Không coi đó là kết quả chạy mới ở phiên khác.

Build từng cảnh báo chunk SDK Firestore khoảng584kB trước gzip, không làm build thất bại. Phạm vi nhóm nhỏ. Không thêm chat, upload file, AI hoặc yêu cầu trả phí.

## Đường dẫn quan trọng

- README.md: cách cài, chạy, test, deploy.
- docs/HUONG-DAN-SU-DUNG.md: sử dụng và kịch bản demo/bảo vệ.
- docs/progress.md: các giai đoạn và bằng chứng. Phần chờ Publish/task chưa làm ở đầu tài liệu là lịch sử; xem task cuối.
- src/features/auth, groups, tasks, activity: các module chính.
- firebase/firestore.rules: quyền máy chủ và điều kiện giao dịch.
- firebase/tests: test Auth/Firestore emulator demo-teamwork, không ghi production.
- .env.example: mẫu cấu hình. .env.emulator: dữ liệu giả cục bộ. .env.local: riêng mỗi máy, không commit.
- START-WEBSITE.cmd / npm start: mở localhost; link Hosting không cần giữ terminal.
- graphify-out: graph cục bộ, sinh lại khi có yêu cầu; không commit cache và đường dẫn máy cá nhân.

## Những lỗi đã xử lý, tránh lặp lại

1. Console Rules báo EOF hoặc bắt đầu bằng && do dán thiếu. Sau đó đã deploy nguyên file bằng CLI; không cần mở quyền hoặc dán từng đoạn lại.
2. Đăng ký operation-not-allowed do chỉ bật Google thay vì Email/Password; đã hướng dẫn bật đúng provider.
3. Logout tab khác giữ currentUser: đã thêm BroadcastChannel signed-out rồi SDK signOut từng tab.
4. Firebase deploy403/No projects found do nhầm tài khoản Google; đăng nhập/chọn đúng tài khoản đã giải quyết. Không tự thay IAM/billing.
5. Graphify interpreter mặc định quá mới gây lỗi build tree-sitter; máy gốc đã có uv tool environment dùng được. Nếu có graphify-out/.graphify_python thì dùng interpreter đã lưu.

## Git và bảo mật

Đã tạo kho **Private** https://github.com/so1so2vahetso-rgb/teamwork ngày15/11/2026 và push main. Mốc mã nguồn ban đầu ac5f590; remote origin đã kết nối và main theo dõi origin/main. CLI đăng nhập tài khoản so1so2vahetso-rgb. Khi hoàn tất lần push đầu đã kiểm chứng SHA local và remote giống nhau; các commit tài liệu sau đó xem bằng git log. Không cần tạo lại kho hoặc đăng nhập lại nếu phiên CLI vẫn hợp lệ.

Commit và push là sao lưu mã, không tự cập nhật Firebase Hosting. Chỉ deploy khi người dùng yêu cầu thay đổi website hoặc triển khai. Chỉ đánh dấu v1.0 khi người dùng chốt bản nộp; bản đầu là mốc khởi đầu để tiếp tục chỉnh sửa.

Không commit .env.local, mật khẩu/token, service account, node_modules, dist, .firebase hoặc log. Kho Private vẫn cần loại thông tin đăng nhập. Cấu hình Firebase Web không thay thế Security Rules; không sửa quyền để làm thử cho dễ.

Khi tiếp nối: đọc AGENTS.md và tài liệu này, hỏi/yêu cầu mới của người dùng là phạm vi đang làm. Không tự tiếp tục kế hoạch cũ hoặc coi sao lưu Git là yêu cầu phát triển tính năng.
