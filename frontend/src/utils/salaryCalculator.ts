/**
 * Dự báo lương tháng dựa trên lịch làm việc thực tế.
 *
 * THUẬT TOÁN:
 *   - Duyệt qua TỪNG NGÀY trong tháng hiện tại (không giả định 4 tuần cố định).
 *   - Với mỗi ngày, dùng `.getDay()` để xác định thứ trong tuần.
 *   - Map sang chỉ số mảng schedule (0=Thứ2, ..., 6=CN) theo quy ước:
 *       getDay() trả về: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
 *       → scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
 *   - Cộng dồn số giờ, rồi nhân với hourlyRate.
 *
 * VÍ DỤ (Tháng 4/2026 — 30 ngày):
 *   schedule = [4, 0, 0, 4, 0, 0, 0]  (Thứ 2 và Thứ 5, mỗi ca 4 giờ)
 *   Tháng 4/2026 có: 5 ngày Thứ Hai, 4 ngày Thứ Năm → 9 ngày × 4h = 36 giờ
 *   hourlyRate = 25.000đ → Dự báo = 36 × 25.000 = 900.000đ
 *   (Nếu nhân sai theo "4 tuần": 2 ngày × 4 tuần × 4h × 25.000 = 800.000đ → SAI)
 *
 * @param schedule - Mảng 7 phần tử [T2, T3, T4, T5, T6, T7, CN], mỗi phần tử là số giờ/ca.
 * @param hourlyRate - Mức lương theo giờ (VNĐ).
 * @returns Tổng thu nhập dự kiến trong tháng hiện tại (VNĐ).
 */
export function calculateMonthlyForecast(schedule: number[], hourlyRate: number): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let totalHours = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month, day).getDay();
    const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    totalHours += schedule[scheduleIndex] ?? 0;
  }

  return totalHours * hourlyRate;
}

/**
 * Tính tổng số giờ làm việc trong tháng hiện tại dựa trên lịch.
 * Sugar function dùng trong UI để hiển thị số giờ mà không cần hourlyRate.
 *
 * @param schedule - Mảng 7 phần tử [T2, T3, T4, T5, T6, T7, CN].
 * @returns Tổng số giờ làm trong tháng.
 */
export function getMonthlyHours(schedule: number[]): number {
  return calculateMonthlyForecast(schedule, 1);
}
