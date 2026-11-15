import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from 'node:process'
import { readFirebaseConfig } from '../src/lib/firebaseConfig.js'

const envFile = fileURLToPath(new URL('../.env.local', import.meta.url))
if (existsSync(envFile)) loadEnvFile(envFile)
const result = readFirebaseConfig(process.env)

if (result.status === 'ready') {
  console.log('Cấu hình cục bộ hợp lệ. Chưa xác minh kết nối hoặc quyền truy cập trên Firebase thật.')
} else {
  if (result.missing.length) console.error(`Thiếu biến: ${result.missing.join(', ')}`)
  if (result.invalid.length) console.error(`Cần kiểm tra định dạng: ${result.invalid.join(', ')}`)
  console.error('Xem docs/firebase-setup.md. Không cần bật thanh toán.')
  process.exitCode = 1
}
