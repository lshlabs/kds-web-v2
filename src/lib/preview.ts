import type { AnalysisAction, AuthSession, Order, OrderAIAnalysis, RiskLevel } from "../types";

export const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === "true";

export function createPreviewSession(): AuthSession {
  return {
    accessToken: "preview-access-token",
    refreshToken: "preview-refresh-token",
    autoLogin: true,
    user: {
      id: 1,
      email: "preview@deeporder.dev",
      name: "테스트 매장",
      role: "STORE_OWNER",
      approvalStatus: "APPROVED",
    },
    store: {
      id: 1,
      storeId: "preview-store",
      storeName: "딥오더 테스트 키친",
      phone: "02-0000-0000",
      zipNo: "06236",
      roadAddress: "서울 강남구 테헤란로 123",
      jibunAddress: "서울 강남구 역삼동 123-45",
      addressDetail: "1층 주방",
      approvalStatus: "APPROVED",
    },
  };
}

export function createPreviewOrders(): Order[] {
  const now = Date.now();

  return [
    buildOrder(now, {
      id: 201,
      orderNumber: "A1B2C3",
      platform: "DELIVERY_BAEMIN",
      status: "NEW",
      minutesAgo: 3,
      customerRequest: "양파 빼주시고 떡 많이 넣어주세요. 국물은 너무 졸지 않게 부탁드립니다.",
      deliveryRequest: "도착하면 문 앞에 두고 노크만 부탁드려요.",
      items: [
        item(2001, "로제 떡볶이", 1, ["맵기 보통", "떡 추가", "양파 제외"], 15000),
        item(2002, "모둠 튀김", 1, ["소스 별도"], 6000),
      ],
      aiAnalysis: analysis({
        summary: "재료 제외와 추가 요청이 함께 있는 주문입니다.",
        riskLevel: "MEDIUM",
        actions: [
          action("EXCLUDE_INGREDIENT", "재료 제외", "양파", "양파 제외", "MEDIUM", [2001]),
          action("COOKING_REQUEST", "조리 요청", "국물", "국물 넉넉히", "LOW", [2001]),
        ],
        cookingNotes: ["양파 제외", "떡 사리 추가", "국물 너무 졸지 않게 조리"],
        packingNotes: ["튀김 소스 별도 포장"],
        deliveryNotes: ["문 앞 전달 후 노크"],
      }),
    }),
    buildOrder(now, {
      id: 202,
      orderNumber: "K7M2Q4",
      platform: "COUPANG_EATS_DELIVERY",
      status: "NEW",
      minutesAgo: 8,
      customerRequest: "아이가 먹을 거라 정말 안 맵게 부탁드리고 치즈는 따로 담아주세요.",
      items: [
        item(2003, "치즈 돈까스", 2, ["소스 반만", "치즈 추가"], 12000),
        item(2004, "우동", 1, ["안 맵게", "면 조금 덜 익힘"], 7000),
        item(2005, "콜라 500ml", 1, [], 2000),
      ],
      aiAnalysis: analysis({
        summary: "맵기 조절과 분리 포장이 필요한 가족 주문입니다.",
        riskLevel: "LOW",
        actions: [
          action("TASTE_ADJUSTMENT", "맛 조절", "맵기", "정말 안 맵게", "LOW", [2004]),
          action("PACKING_REQUEST", "포장 요청", "치즈", "치즈 별도 포장", "LOW", [2003]),
        ],
        cookingNotes: ["우동 맵기 최소화"],
        packingNotes: ["치즈 별도 용기"],
      }),
    }),
    buildOrder(now, {
      id: 203,
      orderNumber: "P9R4T6",
      platform: "YOGIYO_DELIVERY",
      status: "COOKING",
      minutesAgo: 14,
      customerRequest: "땅콩 알레르기 있습니다. 소스 원재료 꼭 확인 부탁드립니다.",
      items: [
        item(2006, "치킨 마요 덮밥", 2, ["마요 적게", "밥 많이"], 9500),
        item(2007, "감자튀김", 1, ["케첩 2개"], 4000),
      ],
      aiAnalysis: analysis({
        summary: "알레르기 확인이 반드시 필요한 주문입니다.",
        riskLevel: "HIGH",
        needsHumanCheck: true,
        warnings: ["땅콩 관련 소스/토핑 직접 확인 필요"],
        actions: [
          action("ALLERGY", "알레르기", "땅콩", "땅콩 알레르기 주의", "HIGH", [2006]),
          action("SAFETY_CHECK", "안전 확인", "소스", "소스 원재료 재확인", "HIGH", [2006]),
        ],
        cookingNotes: ["조리 전 소스 원재료표 확인"],
      }),
    }),
    buildOrder(now, {
      id: 204,
      orderNumber: "H3N8L2",
      platform: "takeout",
      status: "COOKING",
      minutesAgo: 21,
      customerRequest: "김치, 단무지, 수저 모두 빼주세요. 포장봉투는 2개로 나눠주세요.",
      items: [
        item(2008, "부대찌개", 2, ["공기밥 추가", "라면 사리 추가", "햄 많이"], 11000),
        item(2009, "계란말이", 1, ["케첩 제외"], 6000),
        item(2010, "제로콜라", 2, [], 2000),
      ],
      aiAnalysis: analysis({
        summary: "옵션이 많은 포장 주문으로 묶음 완료 상태 테스트에 적합합니다.",
        riskLevel: "MEDIUM",
        actions: [
          action("EXCLUDE_INGREDIENT", "재료 제외", "기본 반찬", "김치/단무지/수저 제외", "MEDIUM", [2008, 2009]),
          action("PACKING_REQUEST", "포장 요청", "봉투", "봉투 2개 분리", "LOW", [2008, 2009, 2010]),
        ],
        packingNotes: ["2개 봉투로 분리 포장"],
      }),
    }),
    buildOrder(now, {
      id: 205,
      orderNumber: "Z4X7V1",
      platform: "store",
      status: "NEW",
      minutesAgo: 1,
      customerRequest: null,
      items: [
        item(2011, "아메리카노", 2, ["아이스", "연하게"], 3000),
        item(2012, "크로플", 1, ["시럽 많이"], 6500),
      ],
      aiAnalysis: null,
    }),
    buildOrder(now, {
      id: 206,
      orderNumber: "M2D8F5",
      platform: "DELIVERY_BAEMIN",
      status: "DONE",
      minutesAgo: 27,
      customerRequest: "단무지 많이 주세요.",
      items: [
        item(2013, "김치볶음밥", 1, ["계란 추가"], 9000),
      ],
      aiAnalysis: null,
    }),
    buildOrder(now, {
      id: 207,
      orderNumber: "Q6W1E9",
      platform: "takeout",
      status: "DONE",
      minutesAgo: 42,
      customerRequest: "도착 전에 전화 부탁드립니다.",
      items: [
        item(2014, "불고기 덮밥", 1, ["고기 많이", "양파 제외"], 9800),
        item(2015, "미소장국", 1, [], 2000),
      ],
      aiAnalysis: analysis({
        summary: "완료 탭에서 칩/요청사항 조합을 확인할 수 있는 주문입니다.",
        riskLevel: "LOW",
        actions: [
          action("EXCLUDE_INGREDIENT", "재료 제외", "양파", "양파 제외", "LOW", [2014]),
        ],
      }),
    }),
    buildOrder(now, {
      id: 208,
      orderNumber: "T5Y3U7",
      platform: "DELIVERY_BAEMIN",
      status: "CANCELLED",
      minutesAgo: 11,
      customerRequest: "취소된 주문입니다.",
      items: [
        item(2016, "순살치킨", 1, ["허니갈릭"], 19000),
      ],
      aiAnalysis: null,
    }),
  ];
}

function buildOrder(
  now: number,
  input: {
    id: number;
    orderNumber: string;
    platform: string;
    status: Order["status"];
    minutesAgo: number;
    customerRequest: string | null;
    deliveryRequest?: string | null;
    items: Order["items"];
    aiAnalysis: OrderAIAnalysis | null;
  },
): Order {
  const orderedAt = new Date(now - input.minutesAgo * 60_000);
  const createdAt = new Date(orderedAt.getTime() + 10_000);
  const updatedAt = new Date(createdAt.getTime() + 90_000);

  return {
    id: input.id,
    platform: input.platform,
    store_id: "preview-store",
    external_order_id: `PREVIEW-${input.orderNumber}`,
    order_number: input.orderNumber,
    status: input.status,
    customer_request: input.customerRequest,
    delivery_request: input.deliveryRequest ?? null,
    ordered_at: orderedAt.toISOString(),
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString(),
    items: input.items,
    aiAnalysis: input.aiAnalysis,
  };
}

function item(id: number, name: string, quantity: number, options: string[], totalPrice: number) {
  return {
    id,
    name,
    quantity,
    options,
    unit_price: quantity > 0 ? Math.round(totalPrice / quantity) : totalPrice,
    total_price: totalPrice,
  };
}

function action(
  type: AnalysisAction["type"],
  label: string,
  target: string,
  displayText: string,
  severity: RiskLevel,
  matchedMenuItemIds: number[],
): AnalysisAction {
  return {
    type,
    label,
    target,
    displayText,
    severity,
    requiresHumanCheck: severity === "HIGH" || type === "SAFETY_CHECK",
    source: "customer_request",
    sourceText: displayText,
    matchedMenuItemIds,
  };
}

function analysis(input: {
  summary: string;
  riskLevel: RiskLevel;
  actions: AnalysisAction[];
  needsHumanCheck?: boolean;
  warnings?: string[];
  tags?: string[];
  cookingNotes?: string[];
  packingNotes?: string[];
  deliveryNotes?: string[];
}): OrderAIAnalysis {
  return {
    summary: input.summary,
    tags: input.tags ?? [],
    cookingNotes: input.cookingNotes ?? [],
    packingNotes: input.packingNotes ?? [],
    deliveryNotes: input.deliveryNotes ?? [],
    kitchenActions: input.actions,
    packingActions: [],
    ignoredRequests: [],
    riskLevel: input.riskLevel,
    warnings: input.warnings ?? [],
    needsHumanCheck: input.needsHumanCheck ?? input.actions.some((item) => item.requiresHumanCheck),
    analysisStatus: "COMPLETED",
  };
}
