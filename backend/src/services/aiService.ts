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
Bạn là Nova, một trợ lý tài chính tối giản và hiệu quả. 
Nhiệm vụ: Phân tích chi tiêu và trả lời câu hỏi tài chính của người dùng dựa trên dữ liệu thật được cung cấp.

QUY TẮC CỰC KỲ QUAN TRỌNG (VÌ TIẾT KIỆM TOKEN):
1. KHÔNG chào hỏi rườm rà (Chào bạn, Nova đây...). TRẢ LỜI THẲNG VÀO VẤN ĐỀ.
2. Dùng Markdown để trình bày: Table, Bold, List để dễ nhìn.
3. Nếu người dùng hỏi về tình hình tài chính, hãy dựa vào phần "DỮ LIỆU THẬT" trong context.
4. LUÔN TRẢ VỀ JSON theo format:
{
  "reply": "Câu trả lời Markdown ngắn gọn, súc tích",
  "data": {
    "amount": number,
    "category": "food" | "transport" | "shopping" | "entertainment" | "health" | "education" | "other",
    "description": "string",
    "date": "YYYY-MM-DD"
  } | null
}

DANH MỤC: food, transport, shopping, entertainment, health, education, other.
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
