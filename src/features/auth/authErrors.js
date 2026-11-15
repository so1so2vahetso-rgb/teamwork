export function authErrorMessage(error) {
  const messages = {
    'auth/invalid-credential': 'Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.',
    'auth/wrong-password': 'Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.',
    'auth/user-not-found': 'Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ admin.',
    'auth/email-already-in-use': 'Email này đã có tài khoản. Bạn không cần đăng ký lại.',
    'auth/invalid-email': 'Địa chỉ email chưa hợp lệ.',
    'auth/weak-password': 'Mật khẩu chưa đáp ứng yêu cầu. Hãy dùng ít nhất 6 ký tự.',
    'auth/password-does-not-meet-requirements': 'Mật khẩu chưa đáp ứng chính sách của hệ thống. Hãy dùng mật khẩu dài hơn, có chữ hoa, chữ thường, số và ký tự đặc biệt.',
    'auth/network-request-failed': 'Không kết nối được mạng. Kiểm tra mạng rồi thử lại.',
    'auth/operation-not-allowed': 'Đăng ký bằng email chưa được bật. Cần bật Email/Password trong Firebase Console.',
    'auth/too-many-requests': 'Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.',
    'registration/invalid-name': 'Họ và tên phải có từ 1 đến 80 ký tự, không chỉ có khoảng trắng.',
    'registration/session-active': 'Trình duyệt đang có phiên tài khoản. Hoàn tất hồ sơ hoặc kết thúc phiên trước khi đăng ký tài khoản khác.',
    'registration/profile-incomplete': 'Tài khoản đã được tạo nhưng hồ sơ chưa lưu xong. Hãy thử lưu lại hồ sơ bên dưới, không đăng ký lại.',
    'registration/no-session': 'Phiên tài khoản không còn. Vui lòng đăng nhập lại.',
    'permission-denied': 'Chưa được phép truy cập. Cần kiểm tra quy tắc đang Publish trên Firestore rồi thử lại.',
    'unavailable': 'Chưa kết nối được Firestore. Kiểm tra mạng rồi thử lại.',
  }
  return messages[error?.code] ?? 'Chưa thực hiện được thao tác. Kiểm tra cấu hình Firebase và thử lại.'
}
