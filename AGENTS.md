# TeamWork — hướng dẫn tiếp nối

- Trước khi xử lý yêu cầu mới, đọc `docs/PROJECT-CONTEXT.md`, `README.md` và `HANDOFF.md` nếu tệp bàn giao cục bộ này tồn tại. Đối chiếu mã nguồn và trạng thái thực tế nếu cần kiểm chứng.
- Trả lời tiếng Việt, hướng dẫn từng bước dễ hiểu; người dùng mới học lập trình.
- Bắt buộc giữ Firebase Spark, không liên kết thanh toán hoặc sử dụng dịch vụ/API trả phí riêng.
- Website đã triển khai. Không tự sửa, deploy hoặc mở rộng tính năng nếu chưa có yêu cầu mới.
- Sau mỗi thay đổi nhỏ của TeamWork do người dùng giao, chạy kiểm tra phù hợp rồi commit và push các tệp thuộc thay đổi đó lên `main` của kho GitHub Public `so1so2vahetso-rgb/teamwork`. Người dùng đã cho phép thực hiện bước sao lưu này mà không cần hỏi lại. Push GitHub không tự triển khai Firebase Hosting.
- `README.md`, `docs/HUONG-DAN-SU-DUNG.md`, `docs/progress.md` chứa tài liệu bản cuối. Tài liệu task cũ ghi nhận lịch sử, không phải toàn bộ trạng thái hiện tại.
- Máy phát triển có Graphify tại `graphify-out/graph.json`; thư mục sinh tự động này không commit. Với câu hỏi kiến trúc hãy truy vấn graph nếu có, không tự xây lại nếu chưa cần. Graph chưa chứa tài liệu bàn giao mới và không phân tích cú pháp trực tiếp Firestore Rules/CSS.
- Không lưu mật khẩu, token hoặc service account trong tài liệu. Không tự tạo dữ liệu thử trong Firebase production.
- Khi hoàn thành công việc mới, cập nhật bản bàn giao với kết quả đã kiểm chứng và việc còn chờ.
