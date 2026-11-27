# Tour Du Lịch

Website đặt tour với Express, MongoDB/Mongoose và Pug. Backend giữ cấu trúc `routes`, `controllers`, `models`, `middlewares`, `validates` và `helpers`; JavaScript trình duyệt dùng `fetch`, giao diện dùng Pug và CSS.

## Báo cáo và giao diện admin

- [Báo cáo toàn bộ thay đổi, trước/sau và kết quả rà soát](docs/BAO_CAO_THAY_DOI_TOAN_BO.md).
- [Danh sách từng file thay đổi, mở bằng Excel](docs/DANH_SACH_FILE_THAY_DOI.csv).
- [Ảnh danh sách tour mới](docs/admin-preview/tours.png), [dashboard](docs/admin-preview/dashboard.png), [form sửa tour](docs/admin-preview/tour-edit.png) và [mobile](docs/admin-preview/mobile.png).

Giao diện admin dùng sidebar trắng, điểm nhấn indigo, bảng ghép ảnh/tên tour và biểu mẫu theo nhóm. Vẫn dùng Pug, CSS và JavaScript hiện có. `index.js` là điểm khởi động; `app.js` cấu hình Express để kiểm thử mà không tự mở server.

### Lối vào liên hệ và phân quyền

Sidebar có các mục trực tiếp **Thông tin liên hệ**, **Tài khoản quản trị** và **Phân quyền**:

- `/admin/contact/list`: thông tin liên hệ / email đăng ký nhận tin; cần `contact-view`.
- `/admin/setting/account-admin/list`: tài khoản quản trị; cần `setting-manage`.
- `/admin/setting/role/list`: tạo/sửa nhóm và các quyền; cần `setting-manage`.

Nếu nhóm tài khoản cũ thiếu các quyền mới này thì mục tương ứng bị ẩn và truy cập trực tiếp trả 403; đây không phải mất trang hoặc mất dữ liệu. Chủ website có thể gán đúng nhóm/quyền, hoặc dùng lệnh `permissions` cho tài khoản quản trị được chỉ định theo hướng dẫn cập nhật bên dưới.

## Chạy dự án

Yêu cầu Node.js 22 trở lên và MongoDB Atlas hoặc MongoDB replica set. Đặt tour, hoàn chỗ và xử lý thanh toán dùng transaction; MongoDB standalone không hỗ trợ các luồng này.

```bash
npm ci
cp .env.example .env
npm run dev
```

Nếu đang dùng Yarn trên Windows CMD:

```bat
yarn install --frozen-lockfile
if not exist .env copy .env.example .env
yarn dev
```

Chỉ tạo `.env` khi chưa có; giữ cấu hình đang dùng và bổ sung các biến thiếu. Sau mỗi lần cập nhật dependency phải cài lại theo lockfile, kể cả khi trước đó đã có `node_modules`.

Điền `DATABASE`, `JWT_SECRET` (ít nhất 32 ký tự ngẫu nhiên), `WEBSITE_DOMAIN` và các dịch vụ cần dùng. Production dùng `npm start`; cổng lấy từ `PORT`. `TRUST_PROXY=1` chỉ phù hợp khi có đúng một reverse proxy tin cậy trước ứng dụng. Mặc định ngày được xử lý theo `Asia/Ho_Chi_Minh`.

## Cập nhật từ phiên bản cũ

1. Sao lưu database và kiểm tra các bản ghi trùng hoặc thiếu email/mã đơn bằng `npm run data:check`. Lệnh này chỉ đọc và báo số lượng, không tự xóa dữ liệu. Unique index cần dữ liệu không trùng.
2. Cài dependency theo lockfile mới. Adapter Cloudinary đã thay `multer-storage-cloudinary` để tương thích Cloudinary 2.
3. Bổ sung các quyền mới cho đúng nhóm quản trị trong database trước khi chuyển phiên bản, hoặc gán một nhóm đầy đủ quyền riêng cho tài khoản quản trị đang hoạt động bằng lệnh dưới. Lệnh này tạo nhóm riêng cho tài khoản được chỉ định, không mở quyền cho tất cả người dùng.

```bash
npm run permissions -- email-quan-tri@example.com
```

4. Trong admin, cấu hình tên website, danh mục ưu tiên và thông tin ngân hàng. Chỉ có phương thức thanh toán được cấu hình mới hiện ở giỏ hàng. Tiền mặt luôn có sẵn; MoMo chưa tích hợp nên đã bỏ lựa chọn.
5. Khai báo IPN VNPay trong cấu hình merchant: `https://ten-mien/order/payment-vnpay-ipn`. Return URL là `/order/payment-vnpay-result`. ZaloPay callback dùng `/order/payment-zalopay-result`.
6. Các link thanh toán khởi tạo ở phiên bản cũ không có bản ghi giao dịch `payments`, nên không được tự động xác nhận bởi phiên bản mới. Hoàn tất hoặc đối soát giao dịch đang chờ trước khi chuyển phiên bản; tạo link mới với đơn chưa trả còn hiệu lực. Không tự nhập giao dịch cũ thành `paid`.
7. Đơn cũ chưa có `reservationExpiresAt` được giữ nguyên để quản trị viên xử lý; không tự hủy hoặc hoàn chỗ hàng loạt. Đơn trực tuyến mới có thời gian giữ chỗ 30 phút. Đơn tiền mặt/chuyển khoản do quản trị viên xác nhận hoặc hủy.

Tài khoản chưa có nhóm quyền vẫn vào được thông tin cá nhân, nhưng không có quyền quản lý dữ liệu. Thay đổi mật khẩu, trạng thái hoặc xóa tài khoản thu hồi phiên cũ. Nếu sửa chính tài khoản đang dùng, cần đăng nhập lại.

## Danh mục và trang chủ

Tự tạo danh mục với tên tùy ý rồi gán tour vào danh mục. Trang chủ hiển thị các danh mục gốc đang hoạt động, lấy tối đa 8 tour mỗi nhóm và bao gồm tour trong danh mục con nhiều cấp. Danh mục ưu tiên được đưa lên trước. Menu sắp theo vị trí và hỗ trợ nhiều cấp. Danh mục bị xóa/tạm dừng làm cả nhánh ẩn phía khách nhưng giữ dữ liệu tour trong admin để có thể khôi phục.

Khối Khám phá các tour lấy tour hoạt động theo vị trí. Tour thiếu lịch/hết chỗ vẫn xem được; giỏ hàng và tạo đơn kiểm tra điều kiện đặt riêng. Form sửa tour có kiểm tra thời điểm cập nhật để không ghi đè số chỗ vừa có khách đặt; khi báo xung đột cần tải lại biểu mẫu. Sau mỗi lần lưu thành công form nhận phiên bản mới để lưu tiếp. Ảnh cũ được giữ theo URL đã có của chính tour; chỉ ảnh mới được tải lên. Bỏ ảnh khỏi biểu mẫu rồi lưu sẽ xóa tham chiếu trong dữ liệu tour.

## Đơn hàng và thanh toán

Giá được lấy từ database, không nhận giá/tổng tiền do trình duyệt gửi. Kiểm tra số lượng nguyên không âm, tour, danh mục, điểm khởi hành và số chỗ. Trừ chỗ và lưu đơn trong một transaction. Hủy đơn hoặc đơn trực tuyến hết hạn hoàn chỗ đúng một lần. Đơn đã hủy không mở lại; cần tạo đơn mới.

Giao dịch thanh toán được lưu riêng theo mã tham chiếu, cổng và số tiền. VNPay kiểm tra chữ ký, merchant, số tiền và cả hai mã thành công; ZaloPay kiểm tra MAC, app và số tiền. Callback lặp không xử lý lại. Giao dịch đến sau khi đơn đã hủy/hết giữ chỗ hoặc có thanh toán trùng được đánh dấu **cần đối soát**, không tự chiếm lại chỗ. Lịch sử giao dịch hiển thị trong trang sửa đơn. Hoàn tiền cần xử lý ở cổng thanh toán và đối soát riêng; ứng dụng không tự gọi hoàn tiền.

Doanh thu chỉ tính đơn đã trả và chưa hủy. Biểu đồ ghi nhận theo ngày thanh toán `paidAt`; đơn cũ chưa có trường này tạm dùng ngày tạo, không tự suy đoán ngày đã thu tiền. Danh sách khách hàng tổng hợp từ đơn theo số điện thoại, không tạo hệ thống tài khoản khách hàng riêng.

## Kiểm tra

```bash
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm audit
```

Kiểm thử tích hợp tạo MongoDB replica set tạm trong thư mục `.test-db-*`, không đọc `.env` và không kết nối database thật. Kiểm thử trình duyệt tạo dữ liệu minh họa riêng, đăng nhập, kiểm tra lọc tour và menu mobile, chụp ảnh vào `docs/screenshots`, rồi đóng database. Lần đầu MongoDB/Chromium cần tải binary.

Cloudinary, Gmail SMTP, VNPay và ZaloPay vẫn cần kiểm thử sandbox bằng cấu hình merchant/tài khoản thật trước khi nhận giao dịch thực tế. Không đưa `.env` hoặc khóa dịch vụ lên GitHub.

## Hiển thị dữ liệu cũ và quy ước code

Tour active chưa có lịch hoặc hết chỗ vẫn được xem; kiểm tra lịch/chỗ áp dụng khi đặt. Khối tổng hợp trang chủ dùng dữ liệu tour hoạt động, không bắt buộc giảm giá hay khởi hành trong 30 ngày. Xem [báo cáo sửa hiển thị và trình bày code](docs/SUA_HIEN_THI_VA_PHONG_CACH_CODE.md) và [quy ước code](AGENTS.md). Quy tắc này thay cho việc ẩn toàn bộ tour thiếu lịch/chỗ của bản sửa trước.

## Logo trang chủ

Vào Admin → Logo trang chủ (hoặc Cài đặt chung → Logo trang chủ), chọn ảnh rồi nhấn Lưu logo. Trang tại `/admin/setting/branding`, cần quyền setting-manage. PNG/JPG/WebP/GIF tối đa 5 MB, tải qua Cloudinary đang dùng cho ảnh tour. Logo dùng chung ở đầu/chân trang, tự co trong khung 180×60 px trên máy tính và 120×40 px trên điện thoại, giữ tỷ lệ và không cắt ảnh. Chưa có logo hoặc ảnh hỏng thì hiển thị tên website. Có thể gỡ ảnh bằng dấu × rồi lưu.
