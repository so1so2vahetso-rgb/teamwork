# TeamWork — Quản lý công việc nhóm

Đồ án môn Hệ phân tán bằng React, Vite, Firebase Authentication và Cloud Firestore. Giao diện tiếng Việt dùng trên máy tính và điện thoại.

**Website:** https://teamworl-3021a.web.app

**Mã nguồn (Private):** https://github.com/so1so2vahetso-rgb/teamwork — nhánh main. Mốc mã nguồn đầu tiên: ac5f590. Cần đăng nhập tài khoản có quyền để xem kho.

Đã triển khai Hosting, Rules và indexes ngày 14/11/2026 vào project teamworl-3021a. Đường link này hoạt động độc lập với máy phát triển.

## Chức năng bản cuối

- Đăng ký email/mật khẩu, đăng nhập, đăng xuất và giữ phiên khi tải lại.
- Một admin quản lý nhóm, thêm/xóa thành viên, tạo/sửa/giao lại/lưu trữ công việc và đặt hạn chót.
- Một người có thể tham gia nhiều nhóm; mỗi việc giao cho đúng một người thuộc nhóm.
- Thành viên xem việc trong nhóm mình, chỉ đổi trạng thái việc được giao cho mình. Ba trạng thái: Chưa làm, Đang làm, Hoàn thành. Có thể chuyển ngược; hoàn thành có hiệu lực ngay.
- Tổng quan, Công việc của tôi, bảng ba cột/danh sách, tìm tên có hoặc không dấu, lọc nhóm/người/trạng thái/quá hạn, thống kê và tỷ lệ hoàn thành.
- Đồng bộ dữ liệu thời gian thực giữa các phiên. Lịch sử hoạt động có phân trang, chỉ admin xem.
- Quyền kiểm tra tại máy chủ. Task, bộ đếm việc và lịch sử ghi nguyên tử; kiểm tra version tránh ghi đè thay đổi của người khác.

Tài khoản mới mặc định là member, chờ admin thêm vào nhóm. Admin hiện tại có UID 7lMpHrrC01PzqfdR2txtPUYNlhF2; không dựa vào việc tự sửa role trong hồ sơ.

Xóa nhóm/công việc bằng **lưu trữ mềm**, giữ dữ liệu và lịch sử. Không xóa được thành viên đang phụ trách việc chưa hoàn thành: cần hoàn thành, giao lại hoặc lưu trữ các việc đó trước.

## Mở trên máy hiện tại

Nhấp đúp START-WEBSITE.cmd hoặc chạy PowerShell:

~~~powershell
cd 'D:\word,pdf,ppt\quanlisinhvien'
npm start
~~~

Mở http://127.0.0.1:5173/ và giữ cửa sổ chạy. Ctrl+C để dừng. Nếu website đã chạy, lệnh mở lại trình duyệt. Dùng link Hosting thì không cần mở terminal.

## Cài trên máy mới

Yêu cầu Node.js 22.12 trở lên; máy hiện tại dùng Node 24.21.

~~~powershell
npm ci
Copy-Item .env.example .env.local
~~~

Điền cấu hình Web App Firebase và UID admin vào .env.local, sau đó:

~~~powershell
npm run check:firebase
npm start
~~~

Không chia sẻ .env.local, không đặt service account hoặc mật khẩu vào frontend. Đổi admin cần sửa cả UID trong .env.local và hàm isAdmin() trong firebase/firestore.rules rồi build/deploy lại.

## Kiểm tra và triển khai

~~~powershell
npm test
npm run test:rules
npm run build
~~~

Test Rules cần Java 21+ và hai cổng 9099/8080 trống. Emulator dùng demo-teamwork, không ghi vào project thật. Thử UI cục bộ bằng hai terminal: npm run emulators và npm run dev:emulator (cổng 5174).

~~~powershell
npx firebase login
npm run deploy
~~~

Deploy build production rồi gửi Rules, indexes, Hosting lên teamworl-3021a; không cần dán Rules thủ công. Đăng nhập nhầm Google: npx firebase login:add rồi npx firebase login:use EMAIL_CUA_BAN.

Kiểm tra bản cuối: **8 unit test và 30 test tích hợp/Rules đạt**. Chrome QA với emulator đã thử admin/member, nhiều nhóm, CRUD, đổi trạng thái realtime, bộ lọc, lịch sử, giữ phiên, logout, offline và bố cục 320/375/768/1440px. Không tạo dữ liệu thử production. Build đạt; có cảnh báo một chunk SDK Firestore khoảng 584 kB trước gzip.

## Chi phí và giới hạn

Giữ gói **Spark**, không liên kết thẻ hoặc nâng cấp Blaze. Chỉ dùng Authentication email/mật khẩu, Firestore và Hosting trong hạn mức miễn phí. Khi hết hạn mức, dịch vụ có thể giới hạn truy cập; tài nguyên không vô hạn. Không cần Functions, Storage, SMS hoặc Gemini.

Cần mạng để đăng nhập, tải và ghi dữ liệu; khi offline thao tác ghi bị khóa. Phạm vi nhóm nhỏ: tổng quan nghe dữ liệu các nhóm được phép, chưa tối ưu cho tổ chức lớn. Font có fallback khi Google Fonts không tải được. Không có khôi phục lưu trữ trong giao diện bản này.

## Tài liệu và mã nguồn

- docs/PROJECT-CONTEXT.md: ngữ cảnh và quyết định để tiếp nối trên máy hoặc phiên mới; đọc cùng AGENTS.md.
- docs/HUONG-DAN-SU-DUNG.md: hướng dẫn, kịch bản demo và giải thích phần hệ phân tán.
- docs/progress.md: tiến độ và bằng chứng từng task.
- src/features/auth/: tài khoản, hồ sơ và phiên.
- src/features/groups/: nhóm, thành viên và trang làm việc.
- src/features/tasks/: giao việc, tổng quan, trạng thái, bộ lọc.
- src/features/activity/: lịch sử chỉ admin.
- src/lib/: cấu hình/client Firebase.
- firebase/firestore.rules và firebase/tests/: quyền máy chủ và kiểm tra.
- firebase.json: Hosting, Firestore và emulator.

Tài liệu task 3–7 trong docs lưu lịch sử giai đoạn; dùng hướng dẫn bản cuối cho trạng thái hiện tại.

## Lưu phiên bản bằng Git

Nhánh chính là main. Commit lưu một mốc trên máy; push gửi mốc lên kho GitHub Private sau khi đăng nhập và kết nối remote. Việc commit/push không tự deploy Firebase.

.gitignore loại .env.local, node_modules, dist, cache Firebase, log và graphify-out. HANDOFF.md là bản ghi cục bộ; ngữ cảnh chia sẻ trong kho nằm ở docs/PROJECT-CONTEXT.md và AGENTS.md. Trên máy mới cần tạo .env.local từ mẫu rồi điền cấu hình đúng project.

Sau khi đã có remote, kiểm tra git status, chỉ thêm các tệp thay đổi cần lưu, rồi git commit và git push. Không force push hoặc thêm cấu hình riêng bằng git add -f.
