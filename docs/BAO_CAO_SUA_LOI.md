# Báo cáo sửa lỗi Tour Du Lịch

Báo cáo đầy đủ hiện nằm tại [BAO_CAO_THAY_DOI_TOAN_BO.md](BAO_CAO_THAY_DOI_TOAN_BO.md). Danh sách chi tiết từng file nằm trong [DANH_SACH_FILE_THAY_DOI.csv](DANH_SACH_FILE_THAY_DOI.csv).

Bản gốc đối chiếu: `676cd2029a7b76b6aa71734ec35541eafbd856ef`. Đợt giao diện mới đối chiếu thêm với `1d87a4b9fcae965a06046a58fc1a3827e52c505e`.

Giao diện mới dùng sidebar trắng, màu indigo, dashboard dữ liệu thật, bảng tour gộp ảnh/tên và form chia nhóm. Đã bỏ stylesheet override `workspace.css` của bản sửa trước.

Đã xử lý các nhóm: ACL/tài khoản/OTP, danh mục nhiều cấp, CRUD tour/ảnh, giỏ hàng/coupon, đặt chỗ trong transaction, hoàn chỗ một lần, callback thanh toán/đối soát, thống kê và dữ liệu cũ.

Kiểm tra hiện tại: 47/47 test tích hợp đạt; 81 file JavaScript kiểm tra cú pháp và 59 template Pug biên dịch đạt; kiểm thử trình duyệt đạt; npm audit báo 0 lỗ hổng tại ngày 27/11/2026. Chi tiết bằng chứng và giới hạn kiểm thử dịch vụ thật được ghi trong báo cáo đầy đủ.

Bổ sung điều hướng: khôi phục tên Thông tin liên hệ; đưa Tài khoản quản trị và Phân quyền ra sidebar trực tiếp. Route và kiểm tra quyền được giữ nguyên; xem mục 9 trong báo cáo đầy đủ.
