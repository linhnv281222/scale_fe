# Electron Build Guide

## Cách sử dụng Electron

### 1. Development (Chạy thử ứng dụng)

```bash
# Build Angular app và chạy Electron
npm run electron:dev
```

### 2. Build ứng dụng thành file .exe

#### Build NSIS Installer (Khuyến nghị)
```bash
npm run electron:build:win:nsis
```

#### Build Portable (Không cần cài đặt)
```bash
npm run electron:build:win:portable
```

#### Build tất cả các loại
```bash
npm run electron:build:win
```

### 3. Kết quả

Sau khi build, các file sẽ nằm trong thư mục `release/`:
- `Scale Management System Setup x.x.x.exe` - NSIS Installer
- `Scale Management System x.x.x-portable.exe` - Portable version

## Lưu ý

1. **Icon**: Nếu muốn thay đổi icon, đặt file `icon.ico` vào thư mục `assets/` (256x256 pixels)

2. **Base href**: Script build electron tự động sử dụng `base-href=./` để phù hợp với môi trường desktop

3. **API Endpoints**: Đảm bảo các API endpoints trong ứng dụng có thể truy cập được từ môi trường desktop

4. **Code Signing**: Để tránh cảnh báo Windows Defender, nên ký code bằng certificate (cần cấu hình thêm)

## Troubleshooting

- Nếu gặp lỗi khi build, thử xóa thư mục `node_modules` và `dist`, sau đó chạy lại `npm install`
- Đảm bảo đã build Angular app thành công trước khi build Electron

