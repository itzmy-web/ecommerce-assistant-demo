#!/usr/bin/env bash
# 回归检查：三张工作流页 + 既有核心页面，确认改造没有弄坏任何页面。
# 用法：bash _regression_check.sh [base_url]
set -u
BASE="${1:-http://127.0.0.1:3000}"
FAIL=0

check() {
  local path="$1"
  local expect="$2"
  local code
  # 演示版 mock API 不校验 token 真伪，带一个会话 cookie 模拟登录态即可。
  code=$(curl -s -o /tmp/_reg_body.html -w "%{http_code}" -H "Cookie: eo_auth_token=demo; eo_entered=1; eo_workspace_id=1" "$BASE$path")
  if [ "$code" = "200" ]; then
    if [ -n "$expect" ] && ! grep -q "$expect" /tmp/_reg_body.html; then
      echo "FAIL $path -> 200 但缺少关键内容: $expect"
      FAIL=1
    else
      echo "PASS $path -> 200"
    fi
  else
    echo "FAIL $path -> HTTP $code"
    FAIL=1
  fi
}

echo "== 三张重设计页面 =="
check "/workflows/product-info" "商品信息体检台"
check "/workflows/ads" "投放建议作战室"
check "/workflows/review" "周期复盘驾驶舱"

echo "== 既有核心页面回归 =="
check "/" "电商运营助手"
check "/products" "商品"
check "/stores" "店铺"
check "/dashboard" "数据看板"
check "/imports" "导入"
check "/agent" "Agent"
check "/login" "登录"

echo "== 商品详情（含 tab） =="
check "/products/1" "单品运营"
check "/products/1?tab=ads" "投放"
check "/products/1?tab=review" "复盘"

if [ "$FAIL" = "0" ]; then
  echo "REGRESSION_ALL_PASS"
else
  echo "REGRESSION_HAS_FAILURES"
  exit 1
fi
