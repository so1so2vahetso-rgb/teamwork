import {groupErrorMessage} from '../groups/groupErrors.js'
export function taskErrorMessage(error){
 return ({
  'tasks/invalid-input':'Tiêu đề cần 1–120 ký tự, mô tả tối đa 2000 ký tự và chọn đúng một người phụ trách.',
  'tasks/invalid-status':'Trạng thái công việc chưa hợp lệ.',
  'tasks/invalid-date':'Hạn chót phải là một ngày hợp lệ.',
  'tasks/invalid-assignee':'Người phụ trách cần là thành viên đang hoạt động trong nhóm. Kiểm tra lại danh sách thành viên.',
  'tasks/conflict':'Công việc đã thay đổi ở phiên khác. Danh sách sẽ cập nhật; kiểm tra lại rồi thử tiếp.',
  'tasks/archived':'Công việc này đã được lưu trữ, không thể chỉnh sửa tiếp.',
  'tasks/not-found':'Không tìm thấy công việc. Vui lòng tải lại danh sách.',
  'permission-denied':'Chưa được phép truy cập công việc. Hãy Publish Rules mới nhất trong Firebase Console rồi tải lại.',
 })[error?.code]??groupErrorMessage(error)
}

