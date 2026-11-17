# Context Dự Án: Auto Task Agent (2D Pixel Office UI)

## 1. Mục tiêu
Xây dựng một website quản lý AI Agent theo phong cách game **Văn phòng 2D Pixel Art / Top-down** (tương tự Stardew Valley / Gather), cho phép người dùng giao nhiệm vụ và quan sát các agent tự động phân công, di chuyển, phối hợp và hoàn thành công việc trực quan.

Giai đoạn hiện tại tập trung vào **bản xem trước giao diện & luồng hoạt động (UI Prototype + Simulation Engine)** với kiến trúc tách bạch để dễ dàng gắn LLM API thật ở bước sau.

## 2. Cơ chế hoạt động & Luồng điều phối
- **Mô hình Manager-Worker:**
  - Mọi nhiệm vụ (Quest) do người dùng tạo đều được gửi đến **Agent Quản lý (Manager)**.
  - Manager tự động phân tích nhiệm vụ, chia nhỏ thành các subtask và giao việc cho các Agent chuyên môn phù hợp.
  - Các Agent nhận việc sẽ di chuyển trong văn phòng (tới bàn làm việc, khu vực họp/tra cứu...), hiển thị trạng thái làm việc và báo cáo kết quả lại cho Manager để tổng hợp thành kết quả cuối cùng.
- **Đội hình Agent:**
  - Mặc định gồm **1 Manager** + **4 Agent chuyên môn**: `Researcher`, `Coder`, `Writer`, `Reviewer`.
  - Hỗ trợ tính năng **tuyển/tạo thêm Agent tùy chỉnh** (tên, vai trò, kỹ năng, ngoại hình/màu sắc).

## 3. Giao diện & Tính năng kiểu Game
- **Bản đồ Văn phòng 2D Pixel Art (HTML5 Canvas):**
  - Không gian văn phòng chia khu vực (bàn Manager, cụm bàn làm việc của team, bàn họp/bảng Quest, khu nghỉ/cây xanh).
  - Nhân vật pixel có animation di chuyển (walking), làm việc (typing/thinking), nghỉ ngơi (idle).
  - **Bong bóng chat / suy nghĩ (Speech Bubbles):** Hiển thị trực tiếp trên đầu nhân vật khi nhận lệnh, suy nghĩ, trao đổi hoặc hoàn thành task.
- **Bảng Quest Board / Mission Control:**
  - Tạo & giao nhiệm vụ mới (nhập mô tả hoặc chọn quest mẫu).
  - Theo dõi tiến độ tổng thể, trạng thái từng subtask và xem kết quả đầu ra cuối cùng.
- **Chi tiết Agent (Agent Inspector):**
  - Click vào từng nhân vật trên bản đồ (hoặc danh sách) để xem chỉ số (`Level`, `XP`, `Tasks Done`, trạng thái hiện tại) và **Terminal / Log hoạt động chi tiết** theo thời gian thực.

## 4. Tech Stack
- **Frontend:** React + TypeScript + Vite + HTML5 Canvas
- **Kiến trúc:** Tách riêng lớp `Simulation / Agent Service` (interface chuẩn để sau này thay bằng API thật như OpenAI / Gemini / Claude mà không cần sửa UI).
