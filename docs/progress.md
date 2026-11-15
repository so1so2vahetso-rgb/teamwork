# Tiến độ TeamWork

## Phạm vi hiện tại

Ban đầu người dùng yêu cầu chia nhỏ đồ án trong hai tuần. Sau task 7, ngày 14/11/2026 người dùng yêu cầu hoàn thiện toàn bộ và xem kết quả cuối; yêu cầu này thay cách dừng sau mỗi task. Bản cuối đã lên https://teamworl-3021a.web.app, Hosting/Rules/indexes triển khai thành công.

## Task 1 — Nền React và giao diện đăng nhập/đăng ký

- Phạm vi: giao diện và nền chạy cục bộ; không Firebase, không session giả hoặc lưu mật khẩu.
- Quyết định: dự án chưa có Git/mã nguồn; triển khai trực tiếp trong thư mục người dùng đã chọn, không tạo worktree.
- Quyết định: form gửi hợp lệ hiển thị thông báo chưa kết nối, không báo đăng nhập/đăng ký thành công.
- Quyết định: chỉ kiểm tra bản build và luồng giao diện thực tế cho thay đổi giao diện có thể sửa lại; kiểm tra quyền dữ liệu dành cho task Firebase.
- Trạng thái: hoàn thành triển khai và kiểm tra, chờ người dùng xem giao diện.
- `npm install`: thành công, 0 lỗ hổng được npm báo tại thời điểm cài.
- `npm run build`: thành công với Vite 8.3.8.
- Kiểm tra Chrome thật bằng Playwright: chuyển hai form; kiểm tra trường bắt buộc; hiện/ẩn mật khẩu; mật khẩu xác nhận không khớp; thông báo không giả đăng nhập/đăng ký thành công; không ghi localStorage/sessionStorage; xóa dữ liệu form khi chuyển chế độ; không có lỗi JavaScript.
- Kiểm tra không tràn ngang tại 320, 375, 768, 1024 và 1440px; đã xem ảnh desktop và mobile.
- Nguồn thư viện: Vite Getting Started https://vite.dev/guide/ và phiên bản npm registry tại thời điểm khởi tạo.

## Task 2 — Hoàn thành nền kết nối và kiểm tra ban đầu

Người dùng đã yêu cầu tiếp tục và xác nhận chưa có project Firebase, cần hướng dẫn tạo.

- Đã chuẩn bị SDK, module khởi tạo lazy, `.env.example`, kiểm tra cấu hình, Rules khóa toàn bộ truy cập từ client và hướng dẫn `docs/firebase-setup.md`.
- Không tự mở quyền database để thử, không tạo project thay người dùng, không bật billing.
- Đã nhận cấu hình Web App project `teamworl-3021a`, điền bốn biến vào `.env.local` (được Git bỏ qua). Không tích hợp Analytics hoặc Storage vì ngoài phạm vi.
- Kiểm tra sau cấu hình: `check:firebase`, 4/4 unit test và build đều đạt.
- Kiểm tra chỉ đọc dịch vụ thật ngày 2026-11-14: endpoint cấu hình Auth trả HTTP 400 `CONFIGURATION_NOT_FOUND`; endpoint Firestore trả HTTP 403 `SERVICE_DISABLED` (API chưa được bật hoặc đang chờ cập nhật). Chưa có bằng chứng dịch vụ sẵn sàng, không ghi dữ liệu hoặc tạo tài khoản.
- Sau đó người dùng xác nhận đã bật Authentication và tạo Firestore tại Hong Kong; bỏ qua scheduled backups, giữ Spark.
- Kiểm tra lại ngày 2026-11-14: cấu hình Auth trả HTTP 200, authorizedDomains có localhost và hai tên miền Firebase của project. Truy cập server vào `task2ConnectionChecks/read-only-probe` bằng REST và SDK thật trên Chrome đều bị `permission-denied`, phù hợp với quyền khóa Production ban đầu. API không còn báo SERVICE_DISABLED.
- SDK của website khởi tạo đúng project `teamworl-3021a`, dùng chung client giữa các lần gọi và không có tài khoản đăng nhập. Không ghi dữ liệu, không tạo tài khoản kiểm thử trên project thật.
- Chỉ kiểm tra đọc chưa xác thực ở một đường dẫn; không suy ra đã kiểm chứng mọi quyền hoặc Rules đang triển khai khớp từng dòng với file cục bộ. Kiểm tra Email/Password thực sự và quyền ghi hồ sơ sẽ làm ở task 3.
- Đăng ký/đăng nhập vẫn chỉ là giao diện thử. Không triển khai task 3/4 trong lần này.
- Task 2 hoàn thành phạm vi nền kết nối. Task 3/4 chưa bắt đầu, các form vẫn là giao diện thử.
- Trước khi nhận cấu hình: `check:firebase` trả exit 1 vì thiếu biến; sau khi điền cấu hình thật trả exit 0. Hai lần kiểm tra đều phản ánh đúng trạng thái.
- Khi cài SDK, npm audit báo grpc-js cũ trong nhánh phụ thuộc Node của Firestore; đã pin override grpc-js 1.14.7. Sau cài lại, npm audit không còn báo lỗ hổng. Nhánh Node/Firestore thực tế vẫn cần kiểm chứng khi sử dụng, chưa tuyên bố đã thử truy cập máy chủ.
- SDK dùng dynamic import khi gọi `getFirebaseClients()` (async), tránh tải Firebase trong giao diện thử chưa dùng dịch vụ.

## Task 3 — Hoàn thành, người dùng xác nhận đăng ký được

- Người dùng yêu cầu làm task 3. Chỉ triển khai đăng ký thật và hồ sơ member; đăng nhập lại/trang làm việc vẫn để task 4.
- Auth tạo tài khoản xong sẽ có phiên theo SDK; giao diện đọc hồ sơ server trước khi hiển thị sẵn sàng/chờ nhóm. Có thao tác kết thúc phiên đăng ký để không mắc kẹt ở trạng thái thử nghiệm; đây là phần tối thiểu cần thiết cho luồng đăng ký, không phải toàn bộ task 4.
- Hồ sơ gồm uid, email, displayName, role member, createdAt; không có password. Rules giới hạn chính chủ, email trùng token, server timestamp, key whitelist; không có quyền list/update/delete hoặc tự nâng quyền.
- Khi Auth thành công nhưng Firestore lỗi, giữ phiên và cho thử lưu hồ sơ. Giao dịch không ghi đè hồ sơ có sẵn; thử lại không tạo tài khoản mới. Khôi phục được sau reload cùng trình duyệt.
- Đã thấy test đỏ trước triển khai; sau triển khai 7/7 kiểm tra Rules/SDK integration đạt với Auth/Firestore Emulator project demo-teamwork. 4/4 kiểm tra cấu hình vẫn đạt; build đạt (có cảnh báo chunk Firestore lớn, để task hoàn thiện).
- Chrome qua UI emulator đạt: tạo tài khoản/hồ sơ, reload giữ phiên, email trùng, partial failure và phục hồi sau reload, mobile không tràn; không có request production hoặc lỗi JS.
- Rà soát độc lập không phát hiện lỗi quan trọng. npm audit production 0; có 14 cảnh báo moderate trong cây phụ thuộc phát triển của firebase-tools, ghi trong docs/task3-registration.md.
- CLI không có tài khoản Google được cấp quyền nên người dùng tự dán Rules qua Console. Đã hướng dẫn vị trí Rules và Publish qua ảnh màn hình.
- Lần thử đầu trên project thật gặp auth/operation-not-allowed; ảnh Console cho thấy mới bật Google. Đã hướng dẫn thêm Email/Password, giữ email link tắt. Người dùng sau đó xác nhận “được rồi” khi thử lại (2026-11-14).
- Ghi nhận hoàn thành theo xác nhận đăng ký thành công của người dùng; không tuyên bố đã tự đọc hồ sơ production bằng quyền quản trị. Không lưu mật khẩu từ chat/ảnh vào mã nguồn hay tài liệu.
- Task 4 chưa bắt đầu; dừng theo yêu cầu làm từng chức năng.

## Checklist

## Task 4 — Triển khai xong, chờ xác nhận admin trên project thật

- Người dùng yêu cầu làm task 4 và chọn UID 7lMpHrrC01PzqfdR2txtPUYNlhF2 làm admin duy nhất. Đã điền env local và hàm isAdmin() trong Rules; không sửa role member trong hồ sơ.
- Đăng nhập/đăng xuất thật, set browserLocalPersistence, khôi phục hồ sơ còn thiếu sau đăng nhập, báo sai thông tin bằng tiếng Việt.
- Nhãn admin yêu cầu getDocFromServer access/admin được Rules chấp nhận (tài liệu có thể không tồn tại). Chỉ đúng UID có quyền get; giả UID ở frontend không đủ. Không cho ghi/list access, các chức năng nhóm vẫn khóa đến task sau.
- Kiểm tra đỏ trước triển khai: role admin bị trả member, service login chưa có, Rules chưa cho phép server role check. Sau triển khai 5 unit + 9 emulator integration/rules đạt.
- Chrome phát hiện tab cũ còn giữ phiên sau khi tab khác logout; xác minh SDK còn currentUser trong tab đó dù storage đã bị xóa. Bổ sung BroadcastChannel chỉ chứa tín hiệu signed-out, mỗi tab gọi SDK signOut. Browser hồi quy sau sửa đã đạt.
- Browser QA cuối: admin/thành viên, sai mật khẩu, đăng ký hồi quy, đăng nhập/đăng xuất, F5 giữ phiên, logout tab khác, mobile không tràn và logout/F5 vẫn là khách; không request production hoặc lỗi JS.
- Người dùng ban đầu chọn Đã Publish nhưng đính chính chưa dán; đã hướng dẫn lại. Mới nhất người dùng nói đã dán và yêu cầu check. Chưa có bằng chứng server xác nhận UID admin trong phiên người dùng, không tuyên bố đã tự đọc nguồn Rules production.
- Chưa làm task 5. Không bật thanh toán hoặc thêm dịch vụ trả phí.

## Task 5 — Đã triển khai và kiểm tra, chờ người dùng Publish/thử project thật

- Người dùng nói “rồi tiếp tục đi” sau task 4; chuyển sang nhóm theo thứ tự đã chốt, chưa làm thêm thành viên.
- Tạo/sửa/lưu trữ mềm nhóm, tên 1–80 ký tự, mô tả tối đa 500, realtime danh sách đang hoạt động và giao diện admin riêng.
- Mỗi mutation ghi audit nguyên tử. Rules admin-only, dữ liệu hợp lệ, tăng version và thời gian máy chủ; log phải gắn thay đổi thật, không bỏ/giả log, không sửa/xóa log.
- Kiểm tra 5 test nhóm mới cùng các test trước: 14 emulator tests đạt và 5 unit đạt. Browser QA tạo/sửa/lưu trữ/hủy, realtime 2 tab, stale conflict, offline khóa ghi, reload và responsive 4 kích thước đạt; đã xem ảnh.
- Rà soát độc lập không có lỗi quan trọng. Không có account/group production nào được công cụ tạo khi thử.
- Đã yêu cầu Publish Rules task 5; người dùng chọn Cần hướng dẫn lại. Chưa tuyên bố Rules task 5 đã có hiệu lực hoặc CRUD production đã thành công.
- Tiếp tục dừng trước task 6; chưa thêm/xóa thành viên.

## Task 6 — Triển khai và kiểm tra xong; hướng dẫn Publish bản đầy đủ

- Người dùng yêu cầu tiếp tục; triển khai thành viên nhiều nhóm, admin tìm đúng email rồi thêm/xóa; thành viên xem nhóm và tên người cùng nhóm.
- Membership/groupRef/audit ghi nguyên tử, version và active soft-removal. Rules khóa dữ liệu riêng tư, chỉ admin thay đổi; chặn remove khi openTaskCount > 0 cho phần công việc sau.
- 20 emulator integration/Rules (6 bài mới) và 5 unit đạt; build đạt. UI hai phiên admin/member qua emulator: nhiều nhóm, thu hồi quyền đóng dialog, hủy/xác nhận xóa, thêm lại/chặn trùng, reload và mobile đạt.
- Rà soát độc lập không có lỗi quan trọng; không tạo dữ liệu thử production.
- Người dùng cần hướng dẫn Publish; ảnh Console báo EOF ở dòng 96. Kiểm tra file gốc đủ 150 dòng, đã biên dịch trên emulator; chẩn đoán phần dán bị kết thúc giữa biểu thức. Đã chép trọn file vào Windows clipboard để người dùng Ctrl+A/Ctrl+V/Publish lại. Chưa tuyên bố đã Publish thành công task 6.
- Chưa làm task 7. Vẫn Spark, không bật thanh toán.

## Task 7 — Mã và kiểm tra xong, chờ Publish/thử project thật

- Người dùng yêu cầu tiếp tục sau hướng dẫn mở server. Phạm vi task 7: admin create/edit/reassign/archive, một người phụ trách đang thuộc nhóm và hạn chót; thành viên chỉ đọc, status update để task 8.
- Thêm trang công việc theo nhóm, form ngày/tiêu đề/mô tả/phụ trách, nhãn Chưa làm, danh sách realtime, lỗi/xung đột/offline và xác nhận lưu trữ.
- Task/log/counter nguyên tử. Rules tính chênh lệch đóng góp trước/sau, gắn lastTaskEvent mới để chặn làm giả bộ đếm. Tạo tăng, giao lại chuyển số việc, archive giảm; giữ nguyên version membership khi chỉ cập nhật bộ đếm.
- Giao lại/lưu trữ giải phóng người phụ trách để xóa khỏi nhóm; danh sách thành viên hiển thị số việc chưa hoàn thành. Chặn UID ngoài nhóm, ngày không có thật, giả status hoặc ghi thiếu bộ đếm/log.
- 26 emulator tests + 5 unit đạt; build đạt. Browser UI ba tài khoản qua emulator: đọc đúng nhóm, admin CRUD, chặn remove còn việc, transfer cho phép remove, stale edit, archive/hủy, 4 kích thước màn hình đạt. Không có dữ liệu thử hoặc request production.
- Rà soát độc lập không có lỗi quan trọng. Cần người dùng Publish Rules task 7 và thử project thật; không tuyên bố đã triển khai Rules production.
- Chưa làm task 8, vẫn Spark miễn phí trong hạn mức.

## Checklist hiện hành

- [x] 1. Nền React và giao diện đăng nhập/đăng ký.
- [x] 2. Kết nối Firebase Spark và bảo mật ban đầu.
- [x] 3. Đăng ký thật, lưu hồ sơ thành viên.
- [x] 4. Đăng nhập/đăng xuất thật, phiên và nhận diện admin.
- [x] 5. Admin quản lý nhóm.
- [x] 6. Quan hệ nhiều thành viên/nhiều nhóm.
- [x] 7. Admin quản lý và phân công công việc.
- [x] 8. Cập nhật trạng thái và realtime.
- [x] 9. Tìm kiếm, lọc, thống kê, quá hạn.
- [x] 10. Màn hình lịch sử chỉ admin; phần ghi log được làm cùng các thao tác dữ liệu trước đó.
- [x] 11. Hoàn thiện giao diện và kiểm tra quyền/lỗi.
- [x] 12. Firebase Hosting Spark và chuẩn bị demo.

## Task 8–11 — Bản đầy đủ đã kiểm tra

- Thành viên chỉ đổi trạng thái việc được giao, admin đổi mọi việc. Cho chuyển ngược; cùng-status không ghi thừa. Giao dịch cập nhật task/counter/log nguyên tử; Rules kiểm tra chênh lệch, version và log liên kết.
- Tổng quan các nhóm có quyền, Công việc của tôi, bảng ba cột/danh sách, tìm tiếng Việt không dấu, bộ lọc độc lập, số liệu và tiến độ. Quá hạn theo ngày Việt Nam, bỏ việc đã hoàn thành.
- Lịch sử admin có phân trang 25 mục, thứ tự thời gian mới nhất, tên người thực hiện và chi tiết trạng thái/phụ trách/hạn chót. Thành viên bị chặn đọc lịch sử.
- Tự vào trang làm việc sau đăng nhập, vẫn quay về tài khoản được; bỏ thông báo phát triển Task N. Có file START-WEBSITE.cmd để mở lần sau.
- Đã thấy test đỏ trước triển khai. Kết quả cuối: 8 unit và 30 kiểm tra tích hợp/Rules đạt. Test lịch sử thử 30 bản ghi, phân trang 25+5 không trùng. Build đạt; một chunk Firestore khoảng 584 kB còn cảnh báo kích thước.
- Chrome QA trên emulator: hai nhóm/sáu việc, search/lọc, board/list, member đúng việc mới đổi trạng thái, doing/done/todo và đồng bộ admin; offline khóa ghi; lịch sử và quyền; phiên/reload/logout; responsive 320/375/768/1440 không tràn ngang. Không có lỗi JavaScript hoặc request Firebase production trong các bài QA đó.
- Rà soát độc lập mã cuối không tìm thấy lỗi quan trọng về phân quyền, giao dịch/bộ đếm/log, thu hồi quyền, phân trang và tự vào trang làm việc. Rà soát không dùng production.

## Task 12 — Đã triển khai 14/11/2026

- Người dùng tự đăng nhập Firebase CLI. Lần đầu nhầm Google không có project, deploy bị 403. Sau login:add tài khoản đúng, CLI thấy teamworl-3021a và chuyển tài khoản cho thư mục này; không thay IAM/billing.
- npm run deploy build thành công, Rules biên dịch thành công trên Firebase, phát hành Rules/indexes/Hosting thành công. URL CLI trả về: https://teamworl-3021a.web.app.
- Kiểm tra HTTP trực tiếp cả 12 file đã deploy đều trả 200. Chrome tải trang đăng nhập từ Hosting và ảnh chụp đã được xem, hiển thị đúng giao diện. Các bài kiểm tra thao tác có đăng nhập chạy trên emulator; không tự đăng nhập tài khoản của người dùng hay tạo dữ liệu demo production.
- Giữ Spark, không gắn thẻ hoặc thêm dịch vụ trả phí. Hướng dẫn đầy đủ và kịch bản bảo vệ trong README.md và docs/HUONG-DAN-SU-DUNG.md.

Những mục chờ Publish ở các task trước là ghi nhận lịch sử, đã được thay bằng kết quả triển khai Rules đầy đủ ở task 12.

## Sao lưu Git — 15/11/2026

- Theo yêu cầu người dùng, khởi tạo kho Git nhánh main và chuẩn bị commit bản hoàn chỉnh đầu tiên. Không đổi chức năng và không deploy lại Firebase.
- Bổ sung loại trừ .firebase, graphify-out, HANDOFF.md cục bộ, cache/log và mẫu khóa riêng. Giữ .env.example và .env.emulator chỉ chứa placeholder/cấu hình giả. Tạo docs/PROJECT-CONTEXT.md theo kho mã để phiên/máy khác có ngữ cảnh.
- Quét 68 tệp staged: không có đường dẫn cấu hình riêng bị cấm hoặc mẫu credential độ tin cậy cao. Không đồng nghĩa quét tự động bảo đảm phát hiện mọi bí mật.
- npm test đạt 8/8; npm run build đạt, vẫn cảnh báo chunk SDK Firestore. Không chạy lại 30 bài Rules vì không sửa logic/Rules. git diff --cached --check báo CR/cuối dòng trống có sẵn; không sửa mã chỉ để đổi định dạng trong công việc sao lưu.
- GitHub CLI portable được tải từ release cli/cli chính thức và kiểm tra SHA256. Người dùng chưa có tài khoản GitHub; đã hướng dẫn đăng ký GitHub Free. Chưa tạo kho remote, chưa push; khi người dùng sẵn sàng sẽ đăng nhập và tạo kho Private. Không đánh dấu v1.0 khi chưa chốt bản nộp.
