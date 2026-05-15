import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// ============================================================
// 🔑 GEMINI KEY ROTATION SYSTEM - Xịn xò nhất
// ============================================================
const rawKeys = (process.env.GEMINI_API_KEYS || process.env.GOOGLE_AI_KEY || "")
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

// Loại bỏ key trùng lặp
const apiKeys = [...new Set(rawKeys)];

if (apiKeys.length === 0) {
  console.error("⚠️  GEMINI_API_KEYS chưa được cấu hình trong .env!");
} else {
  console.log(`🚀 AI Key Rotation Ready: ${apiKeys.length} keys loaded.`);
  apiKeys.forEach((k, i) => console.log(`   Key #${i + 1}: ${k.substring(0, 14)}...`));
}

// Trạng thái của từng key: cooldown đến khi nào (ms timestamp)
const keyCooldowns: Map<number, number> = new Map();
const KEY_COOLDOWN_MS = 60_000; // 60 giây cooldown sau khi bị 429
let currentKeyIndex = 0;

/**
 * Chọn key tốt nhất hiện tại (không trong cooldown)
 */
function getBestKeyIndex(): number {
  const now = Date.now();
  // Thử key hiện tại trước
  if ((keyCooldowns.get(currentKeyIndex) ?? 0) <= now) {
    return currentKeyIndex;
  }
  // Tìm key tiếp theo không bị cooldown
  for (let i = 1; i < apiKeys.length; i++) {
    const idx = (currentKeyIndex + i) % apiKeys.length;
    if ((keyCooldowns.get(idx) ?? 0) <= now) {
      currentKeyIndex = idx;
      console.log(`🔑 Auto-select Key #${idx + 1} (${apiKeys[idx].substring(0, 14)}...) - others in cooldown`);
      return idx;
    }
  }
  // Tất cả đang cooldown → dùng key nào hết cooldown sớm nhất
  let minCooldown = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < apiKeys.length; i++) {
    const cd = keyCooldowns.get(i) ?? 0;
    if (cd < minCooldown) { minCooldown = cd; bestIdx = i; }
  }
  return bestIdx;
}

/**
 * Đánh dấu key hiện tại đang bị rate-limit, chuyển sang key tiếp theo
 */
function rotateKey(failedIndex: number) {
  keyCooldowns.set(failedIndex, Date.now() + KEY_COOLDOWN_MS);
  const nextIndex = (failedIndex + 1) % apiKeys.length;
  currentKeyIndex = nextIndex;
  console.log(`🔄 Key #${failedIndex + 1} → COOLDOWN 60s | Switching to Key #${nextIndex + 1} (${apiKeys[nextIndex].substring(0, 14)}...)`);
}

/**
 * Tạo đối tượng GenerativeAI từ key đang active
 */
function getGenAI(keyIndex: number) {
  return new GoogleGenerativeAI(apiKeys[keyIndex]);
}

/**
 * Wrapper tự động xoay key khi gặp Rate Limit / Quota Error
 * Thử tất cả keys trước khi báo lỗi
 */
async function callWithRetry<T>(fn: (model: any) => Promise<T>): Promise<T> {
  const maxAttempts = apiKeys.length;
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const keyIdx = getBestKeyIndex();
    try {
      const genAI = getGenAI(keyIdx);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await fn(model);
      // ✅ Thành công - log nếu cần
      if (attempt > 0) {
        console.log(`✅ Request succeeded on Key #${keyIdx + 1} after ${attempt} rotation(s)`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      const msg = String(error?.message || error).toLowerCase();
      const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("resource_exhausted");

      if (isRateLimit && apiKeys.length > 1) {
        console.warn(`⚠️  Key #${keyIdx + 1} rate-limited. Rotating...`);
        rotateKey(keyIdx);
        // Delay nhỏ trước khi retry (tránh spam)
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      // Lỗi khác (không phải rate limit) → throw ngay
      throw error;
    }
  }

  console.error("❌ All API keys exhausted or in cooldown.");
  throw lastError ?? new Error("Tất cả API Key đều đã hết quota hoặc gặp sự cố.");
}

export interface AIParsedExpense {
  store?: string;
  amount: number;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'health' | 'education' | 'other';
  description: string;
  date: string;
  time?: string; // HH:mm
}

const SYSTEM_PROMPT = `
Bạn là Nova, trợ lý tài chính thông minh, chuyên nghiệp và lịch sự.
Mục tiêu: Cung cấp thông tin chính xác, hỗ trợ người dùng quản lý tài chính hiệu quả.

QUY TẮC GIAO TIẾP:
1. NGÔN NGỮ: Sử dụng tiếng Việt chuẩn.
2. PHONG THÁI: Lịch sự, thân thiện (dùng "Dạ", "Vâng").
3. SIÊU SÚC TÍCH (TIẾT KIỆM TOKEN): Trả lời cực kỳ ngắn gọn, đi thẳng vào trọng tâm. Không dông dài.
4. TRÌNH BÀY: TUYỆT ĐỐI KHÔNG dùng bảng Markdown (Table) vì giao diện không hỗ trợ. Thay vào đó, nếu cần liệt kê, HÃY DÙNG danh sách gạch đầu dòng (bullet points) đơn giản.
5. ĐỊNH DẠNG SỐ: Luôn dùng dấu chấm phân cách hàng nghìn. TUYỆT ĐỐI BỎ PHẦN THẬP PHÂN. Viết là '2.000.000đ' thay vì '2.000.000,00đ'.

LUÔN TRẢ VỀ JSON THEO ĐỊNH DẠNG:
{
  "reply": "Nội dung phản hồi Markdown (đầy đủ câu cú, lịch sự)",
  "data": { 
    "amount": number, 
    "category": "food" | "transport" | "shopping" | "entertainment" | "health" | "education" | "other", 
    "description": "string", 
    "date": "YYYY-MM-DD",
    "time": "HH:mm"
  } | null
}
`;

export interface AIChatResponse {
  reply: string;
  data: AIParsedExpense | null;
  isCached?: boolean;
}

export async function analyzeReceiptImage(imageBuffer: Buffer, mimeType: string): Promise<AIParsedExpense> {
  return callWithRetry(async (model) => {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      PHÂN TÍCH HÓA ĐƠN:
      1. Kiểm tra xem hình ảnh này có phải là hóa đơn chi tiêu, biên lai mua hàng hoặc phiếu thanh toán không.
      2. Nếu KHÔNG PHẢI hóa đơn, hãy trả về JSON: {"error": "NOT_A_RECEIPT", "message": "Hình ảnh này không phải là hóa đơn hợp lệ."}
      3. Nếu LÀ hóa đơn, hãy bóc tách thông tin theo định dạng JSON sau:
      {
        "store": "Tên cửa hàng",
        "amount": số tiền tổng (number),
        "category": "food" | "transport" | "shopping" | "entertainment" | "health" | "education" | "other",
        "description": "Mô tả ngắn",
        "date": "YYYY-MM-DD",
        "time": "HH:mm"
      }
      Lưu ý: Nếu không thấy ngày, dùng ngày: ${today}. Nếu không thấy giờ, bỏ trống hoặc dùng "00:00".
    `;

    const response = await model.generateContent([
      { text: prompt },
      { inlineData: { data: imageBuffer.toString("base64"), mimeType } }
    ]);

    const result = await response.response;
    const text = result.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về dữ liệu hợp lệ");
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error === "NOT_A_RECEIPT") {
      throw new Error(parsed.message);
    }
    return parsed;
  });
}

export async function analyzeChatMessage(message: string, context?: string): Promise<AIChatResponse> {
  return callWithRetry(async (model) => {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `${SYSTEM_PROMPT}\n\nNGÀY HIỆN TẠI: ${today}\n\nDỮ LIỆU TÀI CHÍNH THỰC TẾ (CONTEXT):\n${context || "Chưa có dữ liệu giao dịch."}\n\nCÂU HỎI NGƯỜI DÙNG: "${message}"\n\nHãy trả lời dựa trên context và bóc tách dữ liệu nếu đó là một giao dịch.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { reply: text || "Dữ liệu không rõ ràng.", data: null };
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return { reply: text, data: null };
    }
  });
}
