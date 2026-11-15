export function groupErrorMessage(error) {
  return ({
    'members/already-joined': 'Người này đã tham gia nhóm.',
    'members/account-not-found': 'Tài khoản chưa có hồ sơ. Người đó cần đăng ký và hoàn tất hồ sơ trước.',
    'members/conflict': 'Danh sách thành viên đã thay đổi. Đóng và mở lại danh sách để thao tác tiếp.',
    'members/has-open-tasks': 'Người này còn công việc chưa hoàn thành. Hãy giao lại công việc trước khi xóa khỏi nhóm.',
    'groups/invalid-input': 'Tên nhóm phải có từ 1 đến 80 ký tự; mô tả tối đa 500 ký tự.',
    'groups/conflict': 'Nhóm đã được thay đổi ở phiên khác. Đóng cửa sổ này và mở lại để dùng dữ liệu mới nhất.',
    'groups/archived': 'Nhóm này đã được lưu trữ, không thể chỉnh sửa tiếp.',
    'groups/not-found': 'Không tìm thấy nhóm. Vui lòng tải lại danh sách.',
    'groups/no-session': 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
    'permission-denied': 'Chưa có quyền quản lý nhóm. Hãy Publish Rules mới nhất trong Firebase Console rồi tải lại.',
    'unavailable': 'Chưa kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
    'resource-exhausted': 'Dịch vụ đang chạm hạn mức sử dụng. Vui lòng thử lại sau.',
  })[error?.code] ?? 'Chưa lưu được thay đổi. Kiểm tra kết nối rồi thử lại.'
}
