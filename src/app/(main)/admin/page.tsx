"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store";
import { useToastActions } from "@/components/ui/toast";

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type AdminUser = {
  id: number;
  email: string;
  name: string;
  provider: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED";
  deleted: boolean;
  createdAt: string;
};

type AdminStory = {
  id: number;
  title: string;
  userId: string;
  language: string;
  hidden: boolean;
  deleted: boolean;
  shareSlug?: string | null;
  shareHidden?: boolean;
  createdAt: string;
};

type OrphanCleanupCandidate = {
  storyId: number;
  title: string;
  userId: string;
  language?: string | null;
  createdAt: string;
};

type OrphanCleanupPreview = {
  olderThanMinutes: number;
  limit: number;
  totalCandidates: number;
  candidates: OrphanCleanupCandidate[];
};

type OrphanCleanupFailure = {
  storyId: number;
  message: string;
};

type OrphanCleanupResult = {
  olderThanMinutes: number;
  limit: number;
  attemptedCount: number;
  deletedCount: number;
  failedCount: number;
  deletedStoryIds: number[];
  failures: OrphanCleanupFailure[];
};

type AdminOrder = {
  id: number;
  userId: number;
  productCode: string;
  productName?: string | null;
  quantity: number;
  pricePerUnit: number;
  totalAmount?: number | null;
  status: string;
  requestedAt?: string | null;
  paidAt?: string | null;
};

type AdminComment = {
  id: number;
  parentId?: number | null;
  authorId?: number | null;
  authorNickname?: string | null;
  content: string;
  deleted: boolean;
  shareSlug?: string | null;
  createdAt: string;
};

type HeartTransaction = {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
};

type TabKey = "users" | "stories" | "orders" | "comments" | "hearts";

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export default function AdminPage() {
  const { user } = useAuthStore();
  const { error: toastError, success: toastSuccess } = useToastActions();
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  const isAdmin = useMemo(() => {
    const role = user?.role || "";
    return role.includes("ADMIN");
  }, [user]);

  // Users
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const loadUsers = async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const data = await apiFetch<PageResponse<AdminUser>>(
        `/admin/users?query=${encodeURIComponent(userQuery)}&page=0&size=20`
      );
      const normalized = (data.content || []).map((u) => {
        const item = asRecord(u);
        return {
          id: Number(item.id),
          email: String(item.email ?? ""),
          name: String(item.name ?? ""),
          provider: String(item.provider ?? ""),
          role: String(item.role ?? ""),
          status: String(item.status ?? item["user_status"] ?? "ACTIVE") as AdminUser["status"],
          deleted: Boolean(item.deleted ?? item["is_deleted"]),
          createdAt: String(item.createdAt ?? item["created_at"] ?? ""),
        };
      });
      setUsers(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "사용자 목록을 불러오지 못했습니다.";
      setUserError(message);
      toastError("회원 조회 실패", message);
    } finally {
      setUserLoading(false);
    }
  };

  const toggleUserStatus = async (userItem: AdminUser) => {
    await apiFetch<AdminUser>(`/admin/users/${userItem.id}`, {
      method: "PATCH",
      body: { status: userItem.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
    });
    loadUsers();
  };

  const toggleUserDeleted = async (userItem: AdminUser) => {
    await apiFetch<AdminUser>(`/admin/users/${userItem.id}`, {
      method: "PATCH",
      body: { deleted: !userItem.deleted },
    });
    loadUsers();
  };

  // Hearts
  const [heartUserId, setHeartUserId] = useState("");
  const [heartDeltaInput, setHeartDeltaInput] = useState("");
  const [heartReason, setHeartReason] = useState("");
  const [heartResult, setHeartResult] = useState<HeartTransaction | null>(null);
  const [heartError, setHeartError] = useState<string | null>(null);
  const [heartLoading, setHeartLoading] = useState(false);

  const submitHeartAdjust = async () => {
    const delta = Number(heartDeltaInput);
    if (!heartUserId || Number.isNaN(delta) || delta === 0) {
      setHeartError("유저 ID와 증감값을 입력하세요.");
      return;
    }
    setHeartLoading(true);
    setHeartError(null);
    try {
      const tx = await apiFetch<HeartTransaction>(`/admin/users/${heartUserId}/hearts`, {
        method: "POST",
        body: { delta, reason: heartReason },
      });
      setHeartResult(tx);
      toastSuccess("하트 조정 완료", `잔액 ${tx.balanceAfter.toLocaleString()}개`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "하트 조정에 실패했습니다.";
      setHeartError(message);
      toastError("하트 조정 실패", message);
    } finally {
      setHeartLoading(false);
    }
  };

  // Stories
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [storyQuery, setStoryQuery] = useState("");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [orphanOlderThanMinutes, setOrphanOlderThanMinutes] = useState("60");
  const [orphanLimit, setOrphanLimit] = useState("50");
  const [orphanLoading, setOrphanLoading] = useState(false);
  const [orphanRunning, setOrphanRunning] = useState(false);
  const [orphanError, setOrphanError] = useState<string | null>(null);
  const [orphanPreview, setOrphanPreview] = useState<OrphanCleanupPreview | null>(null);
  const [orphanResult, setOrphanResult] = useState<OrphanCleanupResult | null>(null);

  const parsePositiveInt = (value: string, fallback: number) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
    return fallback;
  };

  const loadStories = async () => {
    setStoryLoading(true);
    setStoryError(null);
    try {
      const data = await apiFetch<PageResponse<AdminStory>>(
        `/admin/stories?query=${encodeURIComponent(storyQuery)}&page=0&size=20`
      );
      const normalized = (data.content || []).map((s) => {
        const item = asRecord(s);
        return {
          id: Number(item.id),
          title: String(item.title ?? ""),
          userId: String(item.userId ?? item["user_id"] ?? ""),
          language: String(item.language ?? ""),
          hidden: Boolean(item.hidden || item["is_hidden"]),
          deleted: Boolean(item.deleted || item["is_deleted"]),
          shareSlug: String(item.shareSlug ?? item["share_slug"] ?? "") || null,
          shareHidden: Boolean(item.shareHidden || item["share_hidden"]),
          createdAt: String(item.createdAt ?? item["created_at"] ?? ""),
        };
      });
      setStories(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "스토리 목록을 불러오지 못했습니다.";
      setStoryError(message);
      toastError("스토리 조회 실패", message);
    } finally {
      setStoryLoading(false);
    }
  };

  const updateStoryFlags = async (story: AdminStory, patch: Partial<Pick<AdminStory, "hidden" | "deleted">>) => {
    await apiFetch<AdminStory>(`/admin/stories/${story.id}`, {
      method: "PATCH",
      body: patch,
    });
    loadStories();
  };

  const loadOrphanPreview = async () => {
    const olderThanMinutes = parsePositiveInt(orphanOlderThanMinutes, 60);
    const limit = parsePositiveInt(orphanLimit, 50);
    setOrphanLoading(true);
    setOrphanError(null);
    try {
      const raw = asRecord(
        await apiFetch<unknown>(
        `/admin/maintenance/curriculum-orphans?olderThanMinutes=${olderThanMinutes}&limit=${limit}`
        )
      );
      const rawCandidates = Array.isArray(raw.candidates) ? raw.candidates : [];
      const candidates = rawCandidates.map((item) => {
        const row = asRecord(item);
        return {
          storyId: Number(row.storyId ?? row["story_id"] ?? 0),
          title: String(row.title ?? ""),
          userId: String(row.userId ?? row["user_id"] ?? ""),
          language: (row.language ?? null) as string | null,
          createdAt: String(row.createdAt ?? row["created_at"] ?? ""),
        };
      });
      setOrphanPreview({
        olderThanMinutes: Number(raw.olderThanMinutes ?? raw["older_than_minutes"] ?? olderThanMinutes),
        limit: Number(raw.limit ?? limit),
        totalCandidates: Number(raw.totalCandidates ?? raw["total_candidates"] ?? 0),
        candidates,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "고아 스토리 점검에 실패했습니다.";
      setOrphanError(message);
      toastError("고아 스토리 점검 실패", message);
    } finally {
      setOrphanLoading(false);
    }
  };

  const runOrphanCleanup = async () => {
    const olderThanMinutes = parsePositiveInt(orphanOlderThanMinutes, 60);
    const limit = parsePositiveInt(orphanLimit, 50);
    const confirmed = window.confirm(
      `${olderThanMinutes}분 이상 지난 고아 커리큘럼 스토리를 최대 ${limit}건 정리합니다. 계속할까요?`
    );
    if (!confirmed) {
      return;
    }
    setOrphanRunning(true);
    setOrphanError(null);
    try {
      const raw = asRecord(
        await apiFetch<unknown>("/admin/maintenance/curriculum-orphans/cleanup", {
        method: "POST",
        body: { olderThanMinutes, limit },
        })
      );
      const rawFailures = Array.isArray(raw.failures) ? raw.failures : [];
      const failures = rawFailures.map((failure) => {
        const row = asRecord(failure);
        return {
          storyId: Number(row.storyId ?? row["story_id"] ?? 0),
          message: String(row.message ?? ""),
        };
      });
      const normalizedResult = {
        olderThanMinutes: Number(raw.olderThanMinutes ?? raw["older_than_minutes"] ?? olderThanMinutes),
        limit: Number(raw.limit ?? limit),
        attemptedCount: Number(raw.attemptedCount ?? raw["attempted_count"] ?? 0),
        deletedCount: Number(raw.deletedCount ?? raw["deleted_count"] ?? 0),
        failedCount: Number(raw.failedCount ?? raw["failed_count"] ?? 0),
        deletedStoryIds: (Array.isArray(raw.deletedStoryIds)
          ? raw.deletedStoryIds
          : Array.isArray(raw["deleted_story_ids"])
          ? raw["deleted_story_ids"]
          : []) as number[],
        failures,
      };
      setOrphanResult(normalizedResult);
      toastSuccess(
        "고아 스토리 정리 완료",
        `삭제 ${normalizedResult.deletedCount}건, 실패 ${normalizedResult.failedCount}건`
      );
      await loadOrphanPreview();
      await loadStories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "고아 스토리 정리에 실패했습니다.";
      setOrphanError(message);
      toastError("고아 스토리 정리 실패", message);
    } finally {
      setOrphanRunning(false);
    }
  };

  // Orders
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await apiFetch<PageResponse<AdminOrder>>("/admin/billing/orders?page=0&size=20");
      const normalized = (data.content || []).map((o) => {
        const item = asRecord(o);
        return {
          id: Number(item.id),
          userId: Number(item.userId ?? item["user_id"] ?? 0),
          productCode: String(item.productCode ?? item["product_code"] ?? ""),
          productName: (item.productName ?? item["product_name"] ?? null) as string | null,
          quantity: Number(item.quantity ?? 0),
          pricePerUnit: Number(item.pricePerUnit ?? item["price_per_unit"] ?? 0),
          totalAmount: Number(item.totalAmount ?? item["total_amount"] ?? 0),
          status: String(item.status ?? ""),
          requestedAt: (item.requestedAt ?? item["requested_at"] ?? null) as string | null,
          paidAt: (item.paidAt ?? item["paid_at"] ?? null) as string | null,
        };
      });
      setOrders(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "결제 내역을 불러오지 못했습니다.";
      setOrdersError(message);
      toastError("결제 내역 조회 실패", message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Comments
  const [commentSlug, setCommentSlug] = useState("");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);

  const loadComments = async () => {
    if (!commentSlug) {
      setCommentError("슬러그를 입력하세요.");
      return;
    }
    setCommentLoading(true);
    setCommentError(null);
    try {
      const data = await apiFetch<AdminComment[]>(`/admin/shared-stories/${commentSlug}/comments`);
      setComments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "댓글을 불러오지 못했습니다.";
      setCommentError(message);
      toastError("댓글 조회 실패", message);
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleCommentDeleted = async (comment: AdminComment) => {
    await apiFetch<AdminComment>(`/admin/shared-comments/${comment.id}`, {
      method: "PATCH",
      body: { deleted: !comment.deleted },
    });
    loadComments();
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "users") loadUsers();
    if (activeTab === "stories") loadStories();
    if (activeTab === "orders") loadOrders();
  }, [activeTab, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAdmin) {
    return (
      <div className="px-4 py-10 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>접근 권한이 없습니다.</CardTitle>
            <CardDescription>관리자 권한을 가진 계정으로 로그인해주세요.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const TabButton = ({ tab, label }: { tab: TabKey; label: string }) => (
    <Button
      variant={activeTab === tab ? "default" : "ghost"}
      size="sm"
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </Button>
  );

  const renderEmpty = (title: string, description?: string) => (
    <div className="text-sm text-muted-foreground rounded-md border px-4 py-6 bg-muted/30 text-center">
      <div className="font-semibold text-foreground mb-1">{title}</div>
      {description && <div>{description}</div>}
    </div>
  );

  return (
    <div className="px-4 py-10 md:px-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">회원, 스토리, 결제, 댓글, 하트 관리</p>
        </div>
        <div className="flex gap-2 md:ml-auto flex-wrap">
          <TabButton tab="users" label="회원 관리" />
          <TabButton tab="stories" label="스토리 관리" />
          <TabButton tab="orders" label="결제 내역" />
          <TabButton tab="comments" label="댓글 관리" />
          <TabButton tab="hearts" label="하트 조정" />
        </div>
      </div>

      {activeTab === "users" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center">
            <CardTitle>회원 관리</CardTitle>
            <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto">
              <Input
                placeholder="이메일/이름 검색"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="md:max-w-xs"
              />
              <Button onClick={loadUsers} disabled={userLoading}>
                조회
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted/50" />
            ) : userError ? (
              renderEmpty("회원 조회 실패", userError)
            ) : users.length === 0 ? (
              renderEmpty("회원 없음", "검색 조건을 변경해보세요.")
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">이메일</th>
                      <th className="py-2 pr-4">이름</th>
                      <th className="py-2 pr-4">상태</th>
                      <th className="py-2 pr-4">삭제</th>
                      <th className="py-2 pr-4">권한</th>
                      <th className="py-2 pr-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{u.id}</td>
                        <td className="py-2 pr-4">{u.email}</td>
                        <td className="py-2 pr-4">{u.name}</td>
                        <td className="py-2 pr-4">
                          <span className={u.status === "ACTIVE" ? "text-green-600" : "text-yellow-600"}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{u.deleted ? "Y" : "N"}</td>
                        <td className="py-2 pr-4">{u.role}</td>
                        <td className="py-2 pr-4 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => toggleUserStatus(u)}>
                            {u.status === "ACTIVE" ? "정지" : "해제"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleUserDeleted(u)}>
                            {u.deleted ? "복구" : "삭제"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "stories" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center">
            <CardTitle>스토리 관리</CardTitle>
            <div className="flex items-center gap-3 md:ml-auto w/full md:w-auto">
              <Input
                placeholder="제목 검색"
                value={storyQuery}
                onChange={(e) => setStoryQuery(e.target.value)}
                className="md:max-w-xs"
              />
              <Button onClick={loadStories} disabled={storyLoading}>
                조회
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 rounded-md border bg-muted/20 p-4">
              <div className="mb-2">
                <div className="text-sm font-semibold">고아 커리큘럼 스토리 정리</div>
                <div className="text-xs text-muted-foreground">
                  `origin=CURRICULUM` 이고 어느 주차에도 연결되지 않은 스토리를 점검/정리합니다.
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Input
                  type="number"
                  min={30}
                  max={10080}
                  value={orphanOlderThanMinutes}
                  onChange={(e) => setOrphanOlderThanMinutes(e.target.value)}
                  placeholder="기준(분)"
                />
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={orphanLimit}
                  onChange={(e) => setOrphanLimit(e.target.value)}
                  placeholder="처리 건수"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadOrphanPreview} disabled={orphanLoading || orphanRunning}>
                    {orphanLoading ? "점검 중..." : "점검"}
                  </Button>
                  <Button variant="destructive" onClick={runOrphanCleanup} disabled={orphanLoading || orphanRunning}>
                    {orphanRunning ? "정리 중..." : "정리 실행"}
                  </Button>
                </div>
              </div>
              {orphanError && <div className="mt-2 text-xs text-red-600">{orphanError}</div>}
              {orphanPreview && (
                <div className="mt-3 text-xs text-muted-foreground">
                  후보 {orphanPreview.totalCandidates}건 (상위 {orphanPreview.candidates.length}건 표시)
                  {orphanPreview.candidates.length > 0 && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-1 pr-2">Story ID</th>
                            <th className="py-1 pr-2">제목</th>
                            <th className="py-1 pr-2">유저</th>
                            <th className="py-1 pr-2">생성일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orphanPreview.candidates.map((candidate) => (
                            <tr key={candidate.storyId} className="border-b last:border-b-0">
                              <td className="py-1 pr-2">{candidate.storyId}</td>
                              <td className="py-1 pr-2">{candidate.title}</td>
                              <td className="py-1 pr-2">{candidate.userId}</td>
                              <td className="py-1 pr-2">{formatDate(candidate.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {orphanResult && (
                <div className="mt-2 text-xs">
                  <div className="text-green-700">
                    마지막 실행: 시도 {orphanResult.attemptedCount}건 / 삭제 {orphanResult.deletedCount}건 / 실패{" "}
                    {orphanResult.failedCount}건
                  </div>
                  {orphanResult.failures.length > 0 && (
                    <div className="mt-1 text-red-600">
                      실패 ID: {orphanResult.failures.map((failure) => failure.storyId).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {storyLoading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted/50" />
            ) : storyError ? (
              renderEmpty("스토리 조회 실패", storyError)
            ) : stories.length === 0 ? (
              renderEmpty("스토리 없음", "검색 조건을 변경해보세요.")
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">제목</th>
                      <th className="py-2 pr-4">작성자</th>
                      <th className="py-2 pr-4">숨김</th>
                      <th className="py-2 pr-4">삭제</th>
                      <th className="py-2 pr-4">공유</th>
                      <th className="py-2 pr-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stories.map((s) => (
                      <tr key={s.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{s.id}</td>
                        <td className="py-2 pr-4">{s.title}</td>
                        <td className="py-2 pr-4">{s.userId}</td>
                        <td className="py-2 pr-4">{s.hidden ? "Y" : "N"}</td>
                        <td className="py-2 pr-4">{s.deleted ? "Y" : "N"}</td>
                        <td className="py-2 pr-4">
                          {s.shareSlug ? `${s.shareSlug}${s.shareHidden ? " (숨김)" : ""}` : "-"}
                        </td>
                        <td className="py-2 pr-4 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => updateStoryFlags(s, { hidden: !s.hidden })}>
                            {s.hidden ? "노출" : "숨김"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStoryFlags(s, { deleted: !s.deleted })}>
                            {s.deleted ? "복구" : "삭제"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle>결제 내역</CardTitle>
            <CardDescription>최근 결제 요청/완료 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted/50" />
            ) : ordersError ? (
              renderEmpty("결제 내역 조회 실패", ordersError)
            ) : orders.length === 0 ? (
              renderEmpty("주문 없음", "조회된 결제 내역이 없습니다.")
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">유저</th>
                      <th className="py-2 pr-4">상품</th>
                      <th className="py-2 pr-4">총액</th>
                      <th className="py-2 pr-4">상태</th>
                      <th className="py-2 pr-4">요청 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{o.id}</td>
                        <td className="py-2 pr-4">{o.userId}</td>
                        <td className="py-2 pr-4">{o.productName || o.productCode}</td>
                        <td className="py-2 pr-4">{(o.totalAmount ?? 0).toLocaleString()}</td>
                        <td className="py-2 pr-4">{o.status}</td>
                        <td className="py-2 pr-4">{formatDate(o.requestedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "comments" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center">
            <CardTitle>댓글 관리</CardTitle>
            <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto">
              <Input
                placeholder="공유 스토리 슬러그 입력"
                value={commentSlug}
                onChange={(e) => setCommentSlug(e.target.value)}
                className="md:max-w-sm"
              />
              <Button onClick={loadComments} disabled={commentLoading}>
                댓글 조회
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {commentLoading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted/50" />
            ) : commentError ? (
              renderEmpty("댓글 조회 실패", commentError)
            ) : comments.length === 0 ? (
              renderEmpty("댓글 없음", "슬러그를 확인하세요.")
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="border rounded-md p-3 flex justify-between items-start">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        #{c.id} / 작성자: {c.authorId ?? "-"} / {formatDate(c.createdAt)}
                      </div>
                      <div className="font-semibold">{c.content}</div>
                      {c.parentId && <div className="text-[11px] text-muted-foreground">답글 to #{c.parentId}</div>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toggleCommentDeleted(c)}>
                      {c.deleted ? "복구" : "삭제"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "hearts" && (
        <Card>
          <CardHeader>
            <CardTitle>하트 증감</CardTitle>
            <CardDescription>유저별 잔액 조정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="유저 ID"
                value={heartUserId}
                onChange={(e) => setHeartUserId(e.target.value)}
              />
              <Input
                placeholder="증감값 (예: 10 또는 -5)"
                type="number"
                value={heartDeltaInput}
                onChange={(e) => setHeartDeltaInput(e.target.value)}
              />
              <Input
                placeholder="사유 (선택)"
                value={heartReason}
                onChange={(e) => setHeartReason(e.target.value)}
              />
            </div>
            <Button onClick={submitHeartAdjust} disabled={heartLoading}>
              {heartLoading ? "처리 중..." : "하트 조정"}
            </Button>
            {heartError && <div className="text-sm text-red-600">{heartError}</div>}
            {heartResult && (
              <div className="text-sm text-green-700">
                트랜잭션 #{heartResult.id}: {heartResult.amount} → 잔액 {heartResult.balanceAfter}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
