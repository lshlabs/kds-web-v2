import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiError, apiGetKdsOrders, apiUpdateOrderStatus } from "../lib/api";
import { createPreviewOrders, PREVIEW_MODE } from "../lib/preview";
import type { AnalysisAction, AuthSession, Order, OrderAIAnalysis, OrderStatus } from "../types";

const POLLING_INTERVAL_MS = 3000;
type BoardTab = "RECEIVED" | "DONE";

type KdsPageProps = {
  session: AuthSession;
  onLogout: () => Promise<void>;
  onUnauthorized: () => Promise<string | null>;
};

export function KdsPage({ session, onLogout, onUnauthorized }: KdsPageProps) {
  const [orders, setOrders] = useState<Order[]>(() => (PREVIEW_MODE ? createPreviewOrders() : []));
  const [loading, setLoading] = useState(!PREVIEW_MODE);
  const [toast, setToast] = useState<{ message: string; type: "error" | "info" } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<BoardTab>("RECEIVED");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  function showToast(message: string, type: "error" | "info" = "error") {
    setToast({ message, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  }

  const fetchOrders = useCallback(async () => {
    if (PREVIEW_MODE) {
      setLoading(false);
      return;
    }

    try {
      const data = await requestWithReauth(session.accessToken, onUnauthorized, apiGetKdsOrders);
      setOrders(data.orders);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        showToast("로그인이 만료되었습니다.");
        return;
      }
      showToast(error instanceof Error ? error.message : "주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, session.accessToken]);

  useEffect(() => {
    void fetchOrders();
    const pollingTimer = window.setInterval(fetchOrders, POLLING_INTERVAL_MS);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.clearInterval(pollingTimer);
      window.clearInterval(clockTimer);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [fetchOrders]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const counts = useMemo(
    () => ({
      NEW: orders.filter((order) => order.status === "NEW").length,
      COOKING: orders.filter((order) => order.status === "COOKING").length,
      DONE: orders.filter((order) => order.status === "DONE").length,
      CANCELLED: orders.filter((order) => order.status === "CANCELLED").length,
    }),
    [orders],
  );

  const receivedOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === "NEW" || order.status === "COOKING")
        .sort(
          (left, right) => statusWeight(left.status) - statusWeight(right.status) || right.id - left.id,
        ),
    [orders],
  );

  const doneOrders = useMemo(
    () => orders.filter((order) => order.status === "DONE").sort((left, right) => right.id - left.id),
    [orders],
  );

  async function updateOrderStatus(orderId: number, status: OrderStatus) {
    if (PREVIEW_MODE) {
      setUpdatingOrderId(orderId);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status, updated_at: new Date().toISOString() } : order)),
      );
      window.setTimeout(() => setUpdatingOrderId(null), 250);
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      await requestWithReauth(session.accessToken, onUnauthorized, (accessToken) =>
        apiUpdateOrderStatus(accessToken, orderId, status),
      );
      await fetchOrders();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "주문 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setAccountOpen(false);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  const activeOrders = activeTab === "RECEIVED" ? receivedOrders : doneOrders;
  const initials = (session.user.name ?? session.store.storeName ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="kds-shell">
      <nav className={`kds-sidebar${sidebarOpen ? " open" : ""}`} aria-label="메인 내비게이션">
        <button
          aria-label={sidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
          className="kds-sidebar-toggle"
          onClick={() => setSidebarOpen((value) => !value)}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {sidebarOpen ? (
              <>
                <line
                  x1="3"
                  y1="3"
                  x2="15"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <line
                  x1="15"
                  y1="3"
                  x2="3"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <line
                  x1="3"
                  y1="5"
                  x2="15"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <line
                  x1="3"
                  y1="9"
                  x2="15"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <line
                  x1="3"
                  y1="13"
                  x2="15"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
          {sidebarOpen && <span className="kds-sidebar-toggle-label">닫기</span>}
        </button>

        <div className="kds-sidebar-nav">
          <button
            className={`kds-sidebar-item${activeTab === "RECEIVED" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("RECEIVED");
              setSidebarOpen(false);
            }}
            type="button"
            title="접수"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {sidebarOpen && (
              <span>
                접수
                {counts.NEW + counts.COOKING > 0 ? (
                  <em className="kds-sidebar-badge">{counts.NEW + counts.COOKING}</em>
                ) : null}
              </span>
            )}
            {!sidebarOpen && counts.NEW + counts.COOKING > 0 ? (
              <em className="kds-sidebar-dot" aria-hidden="true" />
            ) : null}
          </button>

          <button
            className={`kds-sidebar-item${activeTab === "DONE" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("DONE");
              setSidebarOpen(false);
            }}
            type="button"
            title="완료"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M5.5 9L8 11.5L12.5 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {sidebarOpen && (
              <span>
                완료
                {counts.DONE > 0 ? <em className="kds-sidebar-badge secondary">{counts.DONE}</em> : null}
              </span>
            )}
          </button>
        </div>

        <div className="kds-sidebar-account" ref={accountRef}>
          {accountOpen ? (
            <div className="kds-account-popover">
              <div className="kds-account-popover-info">
                <div className="kds-account-avatar large">{initials}</div>
                <div>
                  <p className="kds-account-name">{session.user.name ?? session.store.storeName}</p>
                  <p className="kds-account-email">{session.user.email}</p>
                </div>
              </div>
              <div className="kds-account-popover-divider" />
              <button
                className="kds-account-popover-item signout"
                disabled={loggingOut}
                onClick={handleLogout}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M11 11l3-3-3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="14" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {loggingOut ? "로그아웃 중…" : "로그아웃"}
              </button>
            </div>
          ) : null}

          <button
            className={`kds-account-trigger${accountOpen ? " active" : ""}`}
            onClick={() => setAccountOpen((value) => !value)}
            type="button"
            title={session.store.storeName}
            aria-expanded={accountOpen}
          >
            <div className="kds-account-avatar">{initials}</div>
            {sidebarOpen ? <span className="kds-account-trigger-name">{session.store.storeName}</span> : null}
          </button>
        </div>
      </nav>

      <div className="kds-main">
        <header className="kds-topbar">
          <div className="kds-topbar-tabs" role="tablist">
            <button
              aria-selected={activeTab === "RECEIVED"}
              className={`kds-tab${activeTab === "RECEIVED" ? " active" : ""}`}
              onClick={() => setActiveTab("RECEIVED")}
              role="tab"
              type="button"
            >
              접수
              <span className="kds-tab-count">{receivedOrders.length}</span>
            </button>
            <button
              aria-selected={activeTab === "DONE"}
              className={`kds-tab${activeTab === "DONE" ? " active" : ""}`}
              onClick={() => setActiveTab("DONE")}
              role="tab"
              type="button"
            >
              완료
              <span className="kds-tab-count">{doneOrders.length}</span>
            </button>
          </div>

          <div className="kds-topbar-right">
            <button
              aria-label="주문 새로고침"
              className={`kds-refresh-btn${loading ? " spinning" : ""}`}
              disabled={loading}
              onClick={() => void fetchOrders()}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        {counts.CANCELLED > 0 ? (
          <div className="banner">취소 주문 {counts.CANCELLED}건은 보드에서 제외하고 집계로만 관리합니다.</div>
        ) : null}

        <section className="kds-board" aria-label="주문 보드">
          {activeOrders.length === 0 ? (
            <div className="kds-empty">
              {activeTab === "RECEIVED" ? "접수된 주문이 없습니다" : "완료된 주문이 없습니다"}
            </div>
          ) : (
            <div className="kds-lane">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  now={now}
                  onUpdateStatus={updateOrderStatus}
                  order={order}
                  updating={updatingOrderId === order.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {toast ? (
        <div
          className={`kds-toast${toast.type === "error" ? " error" : ""}`}
          role="alert"
          aria-live="assertive"
        >
          {toast.type === "error" ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
              <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="7" cy="9.5" r="0.7" fill="currentColor" />
            </svg>
          ) : null}
          <span>{toast.message}</span>
          <button className="kds-toast-close" onClick={() => setToast(null)} type="button" aria-label="닫기">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

async function requestWithReauth<T>(
  accessToken: string,
  onUnauthorized: () => Promise<string | null>,
  request: (token: string) => Promise<T>,
) {
  try {
    return await request(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const nextAccessToken = await onUnauthorized();
    if (!nextAccessToken) {
      throw error;
    }
    return request(nextAccessToken);
  }
}

function OrderCard({
  now,
  onUpdateStatus,
  order,
  updating,
}: {
  now: number;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  order: Order;
  updating: boolean;
}) {
  const elapsed = formatElapsed(now, order.ordered_at ?? order.created_at);
  const elapsedMinutes = getElapsedMinutes(now, order.ordered_at ?? order.created_at);
  const allergyRiskItemIds = getAllergyRiskItemIds(order.aiAnalysis);
  const isUrgent = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 8 && elapsedMinutes < 15;
  const orderTypeLabel = getOrderTypeLabel(order.platform);

  return (
    <article
      className={`kds-card ${order.status.toLowerCase()}${isUrgent ? " urgent" : isWarning ? " warning" : ""}`}
    >
      <div className="kds-card-head">
        <div className="kds-card-head-left">
          <span className="kds-order-num">#{order.order_number ?? order.id}</span>
          <span className={`kds-elapsed-badge${isUrgent ? " urgent" : isWarning ? " warning" : ""}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {elapsed} 경과
          </span>
        </div>
        <span className="kds-order-type">{orderTypeLabel}</span>
      </div>

      <div className="kds-items">
        {order.items.map((item) => (
          <div
            className={`kds-item${allergyRiskItemIds.has(item.id) ? " allergy-risk" : ""}`}
            key={item.id}
          >
            <span className="kds-item-qty">{item.quantity}</span>
            <div className="kds-item-body">
              <span className="kds-item-name">{item.name}</span>
              {item.options.length > 0 ? (
                <ul className="kds-item-options">
                  {item.options.map((option, index) => (
                    <li key={`${item.id}-${index}`}>{option}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <RequestPanel analysis={order.aiAnalysis} customerRequest={order.customer_request} />

      {order.status === "NEW" ? (
        <button
          className="kds-action-btn"
          disabled={updating}
          onClick={() => void onUpdateStatus(order.id, "COOKING")}
          type="button"
        >
          {updating ? "변경중…" : "조리 시작"}
        </button>
      ) : null}
      {order.status === "COOKING" ? (
        <button
          className="kds-action-btn complete"
          disabled={updating}
          onClick={() => void onUpdateStatus(order.id, "DONE")}
          type="button"
        >
          {updating ? "변경중…" : "완료"}
        </button>
      ) : null}
    </article>
  );
}

function RequestPanel({
  analysis,
  customerRequest,
}: {
  analysis: OrderAIAnalysis | null;
  customerRequest: string | null;
}) {
  const rawText = customerRequest?.trim() ?? "";
  if (!analysis && !rawText) {
    return null;
  }

  if (!analysis) {
    return (
      <div className="kds-request-panel">
        <span className="kds-request-label">요청사항</span>
        <p className="kds-request-text">{rawText}</p>
      </div>
    );
  }

  const actions = analysis.kitchenActions ?? [];
  const hasActions = actions.length > 0;
  const hasRaw = rawText.length > 0;
  if (!hasActions && !hasRaw) {
    return null;
  }

  return (
    <div className={`kds-request-panel${analysis.needsHumanCheck ? " needs-check" : ""}`}>
      {analysis.needsHumanCheck ? (
        <span className="kds-request-label urgent">AI 주의 요청</span>
      ) : (
        <span className="kds-request-label">요청사항</span>
      )}
      {hasActions ? (
        <div className="kds-action-chips">
          {actions.map((action, index) => (
            <span className={`kds-chip ${getActionTone(action)}`} key={`${action.displayText}-${index}`}>
              {action.displayText}
            </span>
          ))}
        </div>
      ) : null}
      {hasRaw ? <p className="kds-request-text">{rawText}</p> : null}
    </div>
  );
}

function getOrderTypeLabel(platform: string) {
  const normalized = platform?.toLowerCase() ?? "";
  if (normalized.includes("delivery") || normalized.includes("배달")) {
    return "배달";
  }
  if (normalized.includes("takeout") || normalized.includes("포장") || normalized.includes("take")) {
    return "포장";
  }
  return "매장";
}

function getActionTone(action: AnalysisAction) {
  if (action.type === "ALLERGY" || action.type === "SAFETY_CHECK" || action.severity === "HIGH") {
    return "danger";
  }
  if (action.type === "COOKING_REQUEST" || action.type === "TASTE_ADJUSTMENT") {
    return "cook";
  }
  if (action.type === "EXCLUDE_INGREDIENT") {
    return "exclude";
  }
  return "neutral";
}

function getAllergyRiskItemIds(analysis: OrderAIAnalysis | null) {
  const ids = new Set<number>();
  analysis?.kitchenActions
    ?.filter((action) => action.type === "ALLERGY")
    .forEach((action) => action.matchedMenuItemIds?.forEach((id) => ids.add(id)));
  return ids;
}

function getElapsedMinutes(now: number, timestamp: string) {
  const start = parseApiTimestamp(timestamp).getTime();
  if (Number.isNaN(start)) {
    return 0;
  }
  return Math.floor((now - start) / 60000);
}

function formatElapsed(now: number, timestamp: string) {
  const start = parseApiTimestamp(timestamp).getTime();
  if (Number.isNaN(start)) {
    return "-";
  }

  const seconds = Math.max(0, Math.floor((now - start) / 1000));
  if (seconds < 60) {
    return `${seconds}초`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분`;
  }

  return `${Math.floor(minutes / 60)}시간`;
}

function parseApiTimestamp(timestamp: string) {
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return new Date(timestamp);
  }
  return new Date(`${timestamp}Z`);
}

function statusWeight(status: OrderStatus) {
  if (status === "NEW") return 0;
  if (status === "COOKING") return 1;
  if (status === "DONE") return 2;
  return 3;
}
