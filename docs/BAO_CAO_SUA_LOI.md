# Báo cáo sửa lỗi Tour Du Lịch

Báo cáo đầy đủ hiện nằm tại [BAO_CAO_THAY_DOI_TOAN_BO.md](BAO_CAO_THAY_DOI_TOAN_BO.md). Danh sách chi tiết từng file nằm trong [DANH_SACH_FILE_THAY_DOI.csv](DANH_SACH_FILE_THAY_DOI.csv).

Bản gốc đối chiếu: `676cd2029a7b76b6aa71734ec35541eafbd856ef`. Đợt giao diện mới đối chiếu thêm với `1d87a4b9fcae965a06046a58fc1a3827e52c505e`.

Giao diện mới dùng sidebar trắng, màu indigo, dashboard dữ liệu thật, bảng tour gộp ảnh/tên và form chia nhóm. Đã bỏ stylesheet override `workspace.css` của bản sửa trước.

Đã xử lý các nhóm: ACL/tài khoản/OTP, danh mục nhiều cấp, CRUD tour/ảnh, giỏ hàng/coupon, đặt chỗ trong transaction, hoàn chỗ một lần, callback thanh toán/đối soát, thống kê và dữ liệu cũ.

Kiểm tra hiện tại: 50/50 test tích hợp đạt; 81 file JavaScript kiểm tra cú pháp và 60 template Pug biên dịch đạt; kiểm thử trình duyệt đạt; npm audit báo 0 lỗ hổng tại ngày 27/11/2026. Chi tiết bằng chứng và giới hạn kiểm thử dịch vụ thật được ghi trong báo cáo đầy đủ.

Bổ sung điều hướng: khôi phục tên Thông tin liên hệ; đưa Tài khoản quản trị và Phân quyền ra sidebar trực tiếp. Route và kiểm tra quyền được giữ nguyên; xem mục 9 trong báo cáo đầy đủ.

CI bổ sung điều hướng: [45954343033 — đạt](https://github.com/nguyenhaiphong0711-bit/Tour_Du_Lich/actions/runs/45954343033). Đã khôi phục nhóm quản trị riêng cho một tài khoản cũ sau xác nhận của chủ tài khoản; nhóm quyền cũ được giữ nguyên.

Đợt sửa hiển thị dữ liệu cũ và trình bày lại 69 JS: xem [báo cáo](SUA_HIEN_THI_VA_PHONG_CACH_CODE.md), [CI 49 test và browser đạt](https://github.com/nguyenhaiphong0711-bit/Tour_Du_Lich/actions/runs/45956342532).

Mục Logo trang chủ: tải/thay/gỡ và xem trước; tự co vừa khung desktop/mobile. [CI 45960503621 đạt](https://github.com/nguyenhaiphong0711-bit/Tour_Du_Lich/actions/runs/45960503621), gồm upload bằng Cloudinary giả lập, hiển thị và gỡ ảnh.
