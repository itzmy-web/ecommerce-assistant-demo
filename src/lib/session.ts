import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "eo_auth_token";
export const WORKSPACE_COOKIE_NAME = "eo_workspace_id";
/** 会话级「已通过登录门」标记：无 maxAge 即 session cookie，关闭浏览器自动清除。
 *  配合工作台总览页实现「每次打开（新会话）都先见登录界面」（2026-10-14）。 */
export const ENTERED_COOKIE_NAME = "eo_entered";

/** 读取会话级登录门标记；仅在有登录态时才有意义。 */
export async function hasEnteredSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ENTERED_COOKIE_NAME)?.value === "1";
}

/** 获取认证token，集中维护服务端会话 Cookie 与转发后端所需的认证请求头。 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/** 认证headers，集中维护服务端会话 Cookie 与转发后端所需的认证请求头。 */
export async function authHeaders(): Promise<Record<string, string>> {
  // 服务端组件和 route handler 统一从 httpOnly cookie 转发 Bearer token，前端 JS 不直接持有 token。
  const token = await getAuthToken();
  if (!token) return {};
  const workspaceId = await getActiveWorkspaceId();
  return {
    Authorization: `Bearer ${token}`,
    ...(workspaceId ? { "X-Workspace-ID": String(workspaceId) } : {}),
  };
}

/** Workspace认证headers，集中维护服务端会话 Cookie 与转发后端所需的认证请求头。 */
export async function workspaceAuthHeaders(workspaceId: number): Promise<Record<string, string>> {
  return {
    ...(await authHeaders()),
    "X-Workspace-ID": String(workspaceId),
  };
}

/** 获取当前WorkspaceID，集中维护服务端会话 Cookie 与转发后端所需的认证请求头。 */
export async function getActiveWorkspaceId(): Promise<number | null> {
  const cookieStore = await cookies();
  const value = Number(cookieStore.get(WORKSPACE_COOKIE_NAME)?.value);
  return Number.isInteger(value) && value > 0 ? value : null;
}
