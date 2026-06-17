import type { AuthSession, Order } from "../types";

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
  return JSON.parse(JSON.stringify(PREVIEW_ORDERS)) as Order[];
}

const PREVIEW_ORDERS: Order[] = [
  {
    id: 101,
    platform: "BAEMIN",
    store_id: "preview-store",
    external_order_id: "BM-240617-001",
    order_number: "240617-001",
    status: "NEW",
    customer_request: "양파 빼주시고 떡 많이 넣어주세요.",
    delivery_request: "문 앞에 두고 벨 눌러주세요.",
    ordered_at: "2026-06-17T10:05:00.000Z",
    created_at: "2026-06-17T10:05:10.000Z",
    updated_at: "2026-06-17T10:05:10.000Z",
    items: [
      {
        id: 1001,
        name: "로제 떡볶이",
        quantity: 1,
        options: ["맵기 보통", "떡 추가"],
        unit_price: 15000,
        total_price: 15000,
      },
      {
        id: 1002,
        name: "모둠 튀김",
        quantity: 1,
        options: ["소스 별도"],
        unit_price: 6000,
        total_price: 6000,
      },
    ],
    aiAnalysis: {
      summary: "양파 제외와 떡 추가 요청이 있습니다.",
      tags: ["exclude", "extra"],
      cookingNotes: ["양파 제외", "떡 사리 추가"],
      packingNotes: ["소스 별도 포장"],
      deliveryNotes: ["문 앞 전달 후 벨"],
      kitchenActions: [
        {
          type: "EXCLUDE_INGREDIENT",
          label: "재료 제외",
          target: "양파",
          displayText: "양파 제외",
          severity: "MEDIUM",
          requiresHumanCheck: false,
          source: "customer_request",
          sourceText: "양파 빼주시고 떡 많이 넣어주세요.",
          matchedMenuItemIds: [1001],
        },
      ],
      packingActions: [],
      ignoredRequests: [],
      riskLevel: "MEDIUM",
      warnings: [],
      needsHumanCheck: false,
      analysisStatus: "COMPLETED",
    },
  },
  {
    id: 102,
    platform: "COUPANG_EATS",
    store_id: "preview-store",
    external_order_id: "CP-240617-002",
    order_number: "240617-002",
    status: "COOKING",
    customer_request: "땅콩 알레르기 있어서 소스 확인 부탁드려요.",
    delivery_request: null,
    ordered_at: "2026-06-17T09:58:00.000Z",
    created_at: "2026-06-17T09:58:10.000Z",
    updated_at: "2026-06-17T10:00:00.000Z",
    items: [
      {
        id: 1003,
        name: "치킨 마요 덮밥",
        quantity: 2,
        options: ["마요 적게"],
        unit_price: 9500,
        total_price: 19000,
      },
    ],
    aiAnalysis: {
      summary: "알레르기 관련 확인이 필요한 주문입니다.",
      tags: ["allergy"],
      cookingNotes: ["소스 원재료 확인 필요"],
      packingNotes: [],
      deliveryNotes: [],
      kitchenActions: [
        {
          type: "ALLERGY",
          label: "알레르기",
          target: "땅콩",
          displayText: "땅콩 알레르기 주의",
          severity: "HIGH",
          requiresHumanCheck: true,
          source: "customer_request",
          sourceText: "땅콩 알레르기 있어서 소스 확인 부탁드려요.",
          matchedMenuItemIds: [1003],
        },
      ],
      packingActions: [],
      ignoredRequests: [],
      riskLevel: "HIGH",
      warnings: ["알레르기 원재료 직접 확인 필요"],
      needsHumanCheck: true,
      analysisStatus: "COMPLETED",
    },
  },
  {
    id: 103,
    platform: "YOGIYO",
    store_id: "preview-store",
    external_order_id: "YG-240617-003",
    order_number: "240617-003",
    status: "DONE",
    customer_request: "단무지 많이 주세요.",
    delivery_request: null,
    ordered_at: "2026-06-17T09:40:00.000Z",
    created_at: "2026-06-17T09:40:10.000Z",
    updated_at: "2026-06-17T09:52:00.000Z",
    items: [
      {
        id: 1004,
        name: "김치볶음밥",
        quantity: 1,
        options: ["계란 추가"],
        unit_price: 9000,
        total_price: 9000,
      },
    ],
    aiAnalysis: null,
  },
];
