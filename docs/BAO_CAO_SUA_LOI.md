# Báo cáo sửa lỗi và làm mới admin

Bản sửa dựa trên commit `676cd2029a7b76b6aa71734ec35541eafbd856ef`. Giữ Express, Mongoose, Pug, JavaScript thuần và cấu trúc thư mục đang có.

## Đã sửa

| Nhóm | Kết quả |
|---|---|
| Quyền truy cập | Kiểm tra quyền ở API trước upload/ghi dữ liệu; kiểm tra theo hành động cho thao tác hàng loạt; khởi tạo quyền rỗng khi thiếu nhóm; sidebar phản ánh nhóm quyền. |
| Tài khoản | Giới hạn trường sửa hồ sơ/mật khẩu/cài đặt; thu hồi token khi đổi mật khẩu, khóa hoặc xóa tài khoản; ngăn tự xóa/tự gỡ quyền cài đặt; unique index email. |
| OTP | Mã sinh bằng crypto, lưu hash; giới hạn thử; kiểm tra thời hạn; tiêu thụ một lần; token reset 10 phút dùng riêng, không đăng nhập admin; dùng lại token reset bị chặn. |
| Đặt tour | Kiểm tra thông tin khách, số lượng nguyên không âm, số chỗ, danh mục đang hiện, ngày đi và điểm khởi hành; lấy giá server; transaction trừ chỗ/lưu đơn; mã đơn có unique index. |
| Hủy và giữ chỗ | Hoàn chỗ một lần trong transaction; đơn trực tuyến mới giữ 30 phút; tác vụ giải phóng mỗi phút; đơn đã trả không tự hết hạn; đơn đã hủy không mở lại trực tiếp. |
| Sửa tồn chỗ ở admin | Form gửi thời điểm cập nhật; ghi bị từ chối nếu tour vừa có thay đổi/khách đặt, tránh ghi đè tồn chỗ từ form cũ. |
| VNPay | Kiểm tra chữ ký, merchant, amount, ResponseCode và TransactionStatus; lưu giao dịch; có IPN; phản hồi lặp không xử lý lại; lỗi chữ ký không render template thiếu. |
| ZaloPay | Kiểm tra MAC, app, amount và mã giao dịch đã lưu; chờ API có timeout; lỗi trả trang thông báo thay vì treo request. |
| Đối soát | Thanh toán đến muộn hoặc nhiều giao dịch thành công cho một đơn có cờ cần đối soát; không tự giữ lại chỗ đã giải phóng; admin xem được lịch sử giao dịch. |
| Danh mục | Sửa đệ quy con/cha; ngăn vòng lặp; menu nhiều cấp, sắp theo vị trí; ẩn nhánh có danh mục cha ngừng hoạt động/xóa. |
| Trang chủ | Hiển thị danh mục gốc do admin tự đặt tên, tối đa 8 tour mỗi nhóm; danh mục ưu tiên lên trước; tour giờ chót có điều kiện giảm giá/khởi hành trong 30 ngày; bỏ khu nước ngoài/tin tức/ưu đãi mẫu viết cố định. |
| Tour | Giá/số chỗ được kiểm tra; giá mới không vượt giá gốc; xóa hết gallery được lưu đúng; giữ ảnh cũ khi không thay; tính phần trăm giảm an toàn; ảnh rỗng có placeholder. |
| Giao diện khách | Lấy logo/footer/favicon từ cấu hình; sửa trường ghi chú đơn; escape dữ liệu giỏ hàng và lọc HTML rich text; menu liên hệ dùng điện thoại/email thật; bỏ link demo. |
| Ngân hàng | Thay tài khoản mẫu bằng cấu hình ngân hàng trong admin; phương thức chưa cấu hình không hiển thị. |
| MoMo | Bỏ lựa chọn vì chưa có tích hợp thực tế. Không mô tả là đã tích hợp. |
| Coupon | Thêm model, API, trang quản lý và kiểm tra mã thật; tính lại giảm giá bằng giá server khi đặt đơn; không tin số tiền trình duyệt. |
| Danh sách admin | Lọc/tìm kiếm/phân trang thật cho tour, thùng rác, đơn, khách, liên hệ, tài khoản và nhóm quyền; xóa dữ liệu mẫu và phân trang giả; bổ sung API xóa liên hệ/tài khoản/nhóm quyền. |
| Khách hàng và dashboard | Khách tổng hợp theo số điện thoại từ đơn; đơn mới dùng dữ liệu thật; doanh thu chỉ tính đơn đã trả, chưa hủy; gom truy vấn tên người tạo/nhóm quyền. |
| Giao diện admin | Sidebar xanh đậm, điểm nhấn xanh ngọc, header có ngữ cảnh/ảnh hoặc chữ đại diện, banner dashboard, bảng và biểu mẫu gọn; empty state, focus bàn phím, layout mobile và menu mobile. |
| Khởi động | Hỗ trợ PORT, chờ kết nối/index trước khi nhận request; báo lỗi startup; xử lý lỗi tập trung, upload giới hạn 5 MB/tệp; không ghi stack vào phản hồi. |
| Dependency | Bỏ adapter Cloudinary xung đột, dùng upload_stream của Cloudinary 2; khai báo qs trực tiếp; cập nhật phiên bản có bản vá, bổ sung lockfile. |

## Kiểm chứng

- 30 bài kiểm thử tích hợp chạy với MongoDB replica set tạm: đều đạt.
- Kiểm tra cú pháp 81 file JavaScript và biên dịch 56 template Pug: đạt.
- `npm audit`: 0 lỗ hổng được công cụ báo tại thời điểm kiểm tra.
- Nodemailer JSON transport smoke test: đạt. Không gửi email thật.
- Có kiểm thử trình duyệt cho đăng nhập, tìm tour, menu mobile, overflow và ảnh giao diện; CI thực hiện bằng `npm run test:browser`.
- Kiểm thử trình duyệt đã đạt trên GitHub Actions Ubuntu 24.04: đăng nhập, tìm tour, menu mobile hoạt động; viewport 390px không tràn ngang; không ghi nhận lỗi JavaScript. Đã xem lại ảnh desktop/mobile do CI tạo. Môi trường sửa code cục bộ bị giới hạn Chromium/localhost nên phần xác minh trực quan thực hiện bằng artifact CI.

## Cần cấu hình/kiểm tra khi triển khai

Theo các bước trong README: MongoDB replica set/Atlas, kiểm tra dữ liệu cũ trước unique index, quyền mới cho tài khoản quản trị, JWT_SECRET đủ dài, tên miền, ngân hàng và các khóa dịch vụ.

VNPay/ZaloPay/Gmail/Cloudinary cần kiểm thử sandbox bằng tài khoản thật. Bộ kiểm thử hiện xác minh xử lý request/callback với dữ liệu ký bằng khóa kiểm thử; không chứng minh cấu hình merchant thực tế đã hoạt động. Hoàn tiền không được tự thực hiện; giao dịch cần đối soát phải được xử lý tại cổng thanh toán.

Các link thanh toán cũ không có bản ghi `payments` mới cần được đối soát trước khi cập nhật. Không tự hủy hoặc sửa hàng loạt đơn cũ trong database của người dùng.

Tin tức độc lập, tài khoản đăng nhập riêng của khách và tích hợp MoMo không được xây thêm. Phần giao diện mẫu không có backend tương ứng đã được bỏ hoặc thay bằng dữ liệu thật.

## Tài liệu thanh toán đối chiếu

- VNPay: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- ZaloPay: https://docs.zalopay.vn/docs/specs/callback-api/
