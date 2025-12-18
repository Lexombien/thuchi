import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, WalletType } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AIResponse {
  action: 'transaction' | 'transfer' | 'chat';
  transactionData?: {
    amount: number;
    type: TransactionType;
    wallet: WalletType;
    category: string;
    description: string;
    date: string;
  };
  transferData?: {
    amount: number;
    from: WalletType;
    to: WalletType;
    description: string;
    date: string;
  };
  chatResponse?: string;
}

export const processUserInput = async (text: string): Promise<AIResponse> => {
  try {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Bạn là trợ lý tài chính thông minh của MoneyTalk.
      Nhiệm vụ: Phân tích văn bản "${text}" thành dữ liệu tài chính.
      Ngày hôm nay: ${today}.

      QUY TẮC QUAN TRỌNG:
      1. **Xác định Ví (Wallet):**
         - Nếu có từ "ck", "chuyển khoản", "tk", "tài khoản", "ngân hàng" -> wallet: "account".
         - Nếu có từ "tiền mặt" -> wallet: "cash".
         - KHÔNG có các từ trên -> MẶC ĐỊNH wallet: "cash".
      
      2. **Hành động (Action):**
         - **Giao dịch thường (transaction):** Mua, bán, chi, thu, nhận lương, ăn uống...
         - **Luân chuyển (transfer):** Nạp tiền, rút tiền, chuyển từ ví này sang ví kia.
           - "Nạp tiền vào tk" -> from: "cash", to: "account".
           - "Rút tiền từ tk" -> from: "account", to: "cash".
         - **Trò chuyện (chat):** Câu hỏi chung, chào hỏi.

      3. **Định dạng dữ liệu:**
         - amount: Số nguyên dương (ví dụ: "10k" -> 10000, "1tr" -> 1000000).
         - date: YYYY-MM-DD.

      Yêu cầu trả về JSON theo schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ["transaction", "transfer", "chat"] },
            transactionData: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ["income", "expense"] },
                wallet: { type: Type.STRING, enum: ["cash", "account"] },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                date: { type: Type.STRING }
              },
              nullable: true
            },
            transferData: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER },
                from: { type: Type.STRING, enum: ["cash", "account"] },
                to: { type: Type.STRING, enum: ["cash", "account"] },
                description: { type: Type.STRING },
                date: { type: Type.STRING }
              },
              nullable: true
            },
            chatResponse: { type: Type.STRING }
          },
          required: ["action", "chatResponse"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    
    throw new Error("Empty response");

  } catch (error) {
    console.error("Lỗi AI:", error);
    return {
      action: 'chat',
      chatResponse: "Xin lỗi, hệ thống đang bận."
    };
  }
};
