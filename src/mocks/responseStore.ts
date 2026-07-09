import type { Response, ChildResponse } from "../types";
import { mockFamilies, mockChildren } from "./families";

// eventId -> Response[] のインメモリマップ
const responseStore: Record<string, Response[]> = {};

/**
 * 指定したイベントの回答一覧を取得する。
 * もしまだ1件も回答データが存在しなければ、全家庭分の「未回答」データを自動生成して返す。
 */
export function getResponsesForEvent(eventId: string): Response[] {
  if (!responseStore[eventId]) {
    // 初期データの生成
    const initialResponses: Response[] = mockFamilies.map((family) => {
      const childrenOfFamily = mockChildren.filter((c) => c.familyId === family.id);
      
      const childResponses: ChildResponse[] = childrenOfFamily.map((c) => ({
        childId: c.id,
        isParticipating: true,
        noOutwardRide: false,
        noReturnRide: false,
        remarks: "",
      }));

      return {
        familyId: family.id,
        status: "未回答",
        driverOutward: false,
        driverReturn: false,
        capacityToday: null,
        remarks: "",
        children: childResponses,
      };
    });
    
    responseStore[eventId] = initialResponses;
  }
  
  return responseStore[eventId];
}

/**
 * 指定した家庭の回答データを更新する
 */
export function updateResponse(eventId: string, updatedResponse: Response): void {
  const responses = getResponsesForEvent(eventId);
  const index = responses.findIndex((r) => r.familyId === updatedResponse.familyId);
  if (index !== -1) {
    responses[index] = updatedResponse;
  }
}
