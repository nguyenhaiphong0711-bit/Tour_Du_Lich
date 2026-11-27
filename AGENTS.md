# Quy ước code của project

Giữ phong cách của code gốc tại commit 676cd20, đặc biệt controllers/client/home.controller.js và controllers/admin/tour.controller.js.

- Dùng CommonJS, module.exports và cấu trúc routes/controllers/models/helpers/middlewares/validates đang có.
- Thụt dòng 2 khoảng trắng. Hàm xử lý, if/else, try/catch và object truy vấn phải xuống dòng rõ ràng, có ngoặc khối; không gộp cả hàm vào một dòng.
- Viết từng bước bằng biến có tên dễ hiểu và for/forEach như code hiện có. Callback map đơn giản có thể viết ngắn theo code gốc; logic nhiều bước phải có khối riêng.
- Với Mongoose, giữ cách viết await Model rồi .find(), .sort(), .limit() trên các dòng riêng khi truy vấn dài.
- Tách các phần nghiệp vụ bằng dòng trống; chú thích ngắn bằng tiếng Việt theo chức năng như code gốc.
- Không thay framework, method hoặc thuật toán quen thuộc chỉ để rút ngắn code. Helper mới chỉ tách khi nhiều nơi dùng hoặc cần ranh giới nghiệp vụ rõ.
- Phân biệt hiển thị tour với cho phép đặt tour: dữ liệu cũ thiếu lịch/số chỗ vẫn được xem; chỉ xác nhận đặt chỗ khi đủ điều kiện phía server. Không tự sửa ngày đi hoặc số chỗ trong database để ép tour hiện.
