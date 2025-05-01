Dưới đây là bản dịch tiếng Việt cho tài liệu README của **Rise Testnet Bot**:

---

# Rise Testnet Bot

Một công cụ dòng lệnh để tự động hóa các tương tác với blockchain Rise Testnet. Bot này giúp người dùng thực hiện nhiều loại giao dịch khác nhau như chuyển tiền ngẫu nhiên, bọc/mở bọc token, hoán đổi token và gửi/rút tiền từ Inari Bank.

## 🌟 Tính Năng

- **Chuyển Ngẫu Nhiên**: Gửi ETH đến các địa chỉ được tạo ngẫu nhiên  
- **Gas Pump**: Bọc/Mở bọc ETH, phê duyệt token, hoán đổi giữa WETH/USDC  
- **Inari Bank**: Gửi và rút ETH từ Inari Bank  
- **Hỗ Trợ Proxy**: Sử dụng proxy để tránh giới hạn tốc độ (rate limit)  
- **Giao Diện CLI Thân Thiện**: Giao diện dòng lệnh dễ sử dụng với màu sắc nổi bật  

## 📋 Yêu Cầu Trước Khi Sử Dụng

- Node.js (phiên bản 14 trở lên)  
- npm hoặc yarn  
- Ví Ethereum có ETH trên Rise Testnet  

## 🔧 Cài Đặt

Clone repository:

```bash
git clone https://github.com/Zack914/Rise-Testnet-Bot.git
cd Rise-Testnet-Bot
```

Cài đặt các thư viện cần thiết:

```bash
npm install
```

## ⚙️ Cấu Hình

1. Sao chép file `.env` từ mẫu:

```bash
cp .env.example .env
```

Điền private key vào file `.env`:

```
PRIVATE_KEY=nhập_private_key_của_bạn_tại_đây
```

2. (Tùy chọn) Tạo file `proxies.txt`, mỗi dòng một proxy:

```
http://ip:port
http://ip:port@username:password
```

## 🚀 Cách Sử Dụng

Khởi động bot:

```bash
node index.js
```

### Menu Chính

Bot sẽ hiển thị menu tương tác với các lựa chọn sau:

1. **Gửi đến các địa chỉ ngẫu nhiên**: Tự động gửi nhiều giao dịch đến các địa chỉ ngẫu nhiên  
2. **Gas Pump**: Truy cập các chức năng bọc/mở bọc token và hoán đổi token  
3. **Inari Bank**: Gửi hoặc rút ETH từ Inari Bank  
4. **Thoát**: Đóng ứng dụng  

### Menu Gas Pump

1. **Bọc ETH thành WETH**  
2. **Mở bọc WETH thành ETH**  
3. **Phê duyệt WETH cho DODO**  
4. **Hoán đổi WETH sang USDC**  
5. **Hoán đổi USDC sang WETH**  
6. **Quay lại menu chính**  

### Menu Inari Bank

1. **Gửi ETH vào Inari Bank**  
2. **Rút ETH từ Inari Bank**  
3. **Quay lại menu chính**  

## 📝 Địa Chỉ Hợp Đồng

Bot sử dụng các địa chỉ hợp đồng sau trên Rise Testnet:

- **WrappedTokenGatewayV3**: 0x832e537e88d0e8e5bb4efb735f521a9a0e085e0a  
- **WETH**: 0x4200000000000000000000000000000000000006  
- **DODOFeeRouteProxy**: 0x8c6DbF95448AcbcBb1c3D6E9b3b9ceF7E6fbAb00  
- **USDC**: 0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8  

## ⚠️ Cảnh Báo

Bot này chỉ dành cho mục đích học tập và thử nghiệm trên Rise Testnet. **Không sử dụng trên mainnet hoặc với tiền thật**. Luôn xác minh địa chỉ hợp đồng và nội dung giao dịch trước khi xác nhận.

---

Bạn có muốn mình tạo bản Markdown (.md) hoàn chỉnh từ bản dịch này không?
