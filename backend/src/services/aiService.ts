import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Parse multiple API keys for rotation
const apiKeys = (process.env.GEMINI_API_KEYS || process.env.GOOGLE_AI_KEY || "").split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

if (apiKeys.length === 0) {
  console.error("⚠️ GEMINI_API_KEYS chưa được cấu hình trong .env!");
} else {
  console.log(`📡 AI Service: Loaded ${apiKeys.length} keys. Starting with: ${apiKeys[0].substring(0, 10)}...`);
}

/**
 * Lấy đối tượng GenerativeAI dựa trên key hiện tại
 */
function getGenAI() {
  return new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
}

/**
 * Chuyển sang API Key tiếp theo
 */
function rotateKey() {
  if (apiKeys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`🔄 Switched to Gemini API Key #${currentKeyIndex + 1} (${apiKeys[currentKeyIndex].substring(0, 10)}...)`);
  }
}

/**
 * Wrapper hỗ trợ tự động xoay key khi gặp lỗi Rate Limit (429)
 */
async function callWithRetry<T>(fn: (model: any) => Promise<T>, isVision = false): Promise<T> {
  let attempts = 0;
  const maxAttempts = apiKeys.length;

  while (attempts < maxAttempts) {
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      return await fn(model);
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuotaExceeded = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Rate limit");
      
      if (isQuotaExceeded && apiKeys.length > 1 && attempts < maxAttempts - 1) {
        rotateKey();
        attempts++;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Tất cả API Key đều đã hết hạn mức hoặc gặp sự cố.");
}

export interface AIParsedExpense {
  store?: string;
  amount: number;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'health' | 'education' | 'other';
  description: string;
  date: string;
}

const SYSTEM_PROMPT = `
Bạn là Nova, một trợ lý tài chính cá nhân thông minh, thân thiện và chuyên nghiệp.
Nhiệm vụ của bạn là trò chuyện với người dùng và hỗ trợ họ quản lý chi tiêu.

QUY TẮC PHẢN HỒI:
1. Luôn phản hồi bằng tiếng Việt với giọng văn tự nhiên, gần gũi như một người bạn thực thụ.
2. Nếu người dùng nhắn tin về một khoản chi tiêu (vd: "Nay ăn sáng 50k"), hãy bóc tách thông tin VÀ đưa ra một câu phản hồi xác nhận thân thiện.
3. Nếu người dùng chỉ chào hỏi hoặc hỏi đáp bình thường, hãy trả lời tự nhiên và giữ đúng vai trò là trợ lý tài chính.
4. LUÔN TRẢ VỀ kết quả dưới dạng JSON có cấu trúc như sau:

{
  "reply": "Câu trả lời tự nhiên của bạn ở đây",
  "data": {
    "store": "Tên cửa hàng hoặc null",
    "amount": số tiền VNĐ (number),
    "category": "food" | "transport" | "shopping" | "entertainment" | "health" | "education" | "other",
    "description": "Mô tả ngắn gọn",
    "date": "YYYY-MM-DD"
  } | null
}

DANH MỤC CHI TIÊU:
- 'food': Ăn uống, cà phê, nhà hàng.
- 'transport': Xăng xe, Grab, Bus, Taxi.
- 'shopping': Mua sắm, Shopee, Tiki, Lazada.
- 'entertainment': Giải trí, phim, game, du lịch.
- 'health': Sức khỏe, thuốc, gym.
- 'education': Học tập, sách, khóa học.
- 'other': Các khoản khác.
`;

export interface AIChatResponse {
  reply: string;
  data: AIParsedExpense | null;
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
        "date": "YYYY-MM-DD"
      }
      Lưu ý: Nếu không thấy ngày, dùng ngày: ${today}.
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

export async function analyzeChatMessage(message: string): Promise<AIChatResponse> {
  return callWithRetry(async (model) => {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `${SYSTEM_PROMPT}\n\nTin nhắn từ người dùng: "${message}"\nNgày hiện tại: ${today}\nHãy trả lời và bóc tách dữ liệu nếu cần.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { reply: text || "Xin lỗi, mình chưa hiểu ý bạn. Bạn thử nói lại nhé!", data: null };
    }

    return JSON.parse(jsonMatch[0]);
  });
}
