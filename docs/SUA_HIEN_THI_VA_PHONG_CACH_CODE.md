# Sửa hiển thị dữ liệu và phong cách JavaScript

Đối chiếu trực tiếp database project-5: có tour active, chưa xóa nhưng departureDate=null và số chỗ bằng 0. Bộ lọc mở bán thêm ở bản trước đã làm những tour này biến mất khỏi trang khách. Không có thao tác sửa dữ liệu tour trong database ở đợt này.

Đã tách visibleFilter (hiển thị) và bookableFilter (có thể đặt). Trang chủ, danh mục, tìm kiếm và chi tiết cho xem tour active thuộc danh mục hợp lệ; tour cũ chưa gán danh mục có mặt ở danh sách tổng hợp. Nhánh danh mục đã xóa/tạm dừng vẫn ẩn. Giỏ hàng và tạo đơn vẫn kiểm tra lịch, điểm đi và chỗ trống. Chi tiết tour chưa đủ điều kiện có thông báo chưa nhận đặt, không có nút thêm vào giỏ.

Khối tổng hợp trang chủ được đổi thành “Khám phá các tour”, lấy dữ liệu hoạt động theo vị trí như cách viết gốc, thay cho khối giờ chót chỉ lấy tour giảm giá sắp đi. Nhóm danh mục vẫn lấy cả tour ở cấp con/cháu. Không tự đặt lịch hoặc số chỗ giả để hiển thị.

Đã trình bày lại 69 file JS từng thay đổi từ bản gốc: thụt dòng 2 khoảng trắng, tách object và khối điều kiện/hàm, giữ CommonJS và cấu trúc dự án. Controller trang chủ dùng các biến trung gian, for, map và chuỗi truy vấn xuống dòng giống bản gốc. Không thêm dependency định dạng vào ứng dụng. Quy ước cho các lần sửa tiếp được ghi trong AGENTS.md.

Kiểm tra: 49 test tích hợp đạt; 81 JS kiểm tra cú pháp, 59 Pug biên dịch đạt. Hai ca mới kiểm tra tour null lịch/hết chỗ vẫn xem được nhưng bị chặn đặt, và tour cũ chưa gán danh mục vẫn hiện. Kết quả trình duyệt được kiểm tra riêng trên GitHub Actions.

Bỏ các gợi ý Nhật Bản/Singapore/50 tours viết cố định trong ô tìm kiếm. Gợi ý hiện lấy tên, ảnh và thời gian từ tour thật được controller trả về.

[CI xác minh](https://github.com/nguyenhaiphong0711-bit/Tour_Du_Lich/actions/runs/45956342532): 49/49 test, browser đạt, không ghi nhận lỗi JS; desktop và mobile không tràn trang.
