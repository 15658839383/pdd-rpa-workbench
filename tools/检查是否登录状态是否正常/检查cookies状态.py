import argparse
import json
import re
import sys
import urllib.error
import urllib.request


ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as"
CHECK_URL = "https://mms.pinduoduo.com/vodka/v2/mms/query/display/mall/goodsCount"
DEFAULT_TIMEOUT = 10


def request_json(url, method="GET", headers=None, payload=None, timeout=DEFAULT_TIMEOUT):
    data = None
    request_headers = dict(headers or {})

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        request_headers.setdefault("content-type", "application/json")

    request = urllib.request.Request(url, data=data, headers=request_headers, method=method)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8", errors="replace")
        return response.getcode(), parse_json(raw)


def parse_json(raw):
    text = str(raw or "").strip()
    if not text:
        return None

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}


def build_result(ok, **kwargs):
    result = {"ok": ok}
    result.update(kwargs)
    return result


def extract_message(payload, fallback):
    if isinstance(payload, dict):
        for key in ("errorMsg", "message", "msg", "error"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return fallback


def is_login(cookie_value1):
    normalized_cookie = str(cookie_value1 or "").strip()
    if not normalized_cookie:
        return build_result(False, code="COOKIE_MISSING", message="该店铺缺少 cookie1，无法检查在线状态")

    etag_match = re.search(r"rckk=([^;]+)", normalized_cookie)
    if not etag_match:
        return build_result(False, code="ETAG_MISSING", message="该店铺的 cookie1 中缺少 rckk，无法检查在线状态")

    try:
        anti_status, anti_payload = request_json(
            ANTI_CONTENT_URL,
            headers={"accept": "application/json"},
        )
    except urllib.error.URLError as error:
        return build_result(False, code="ANTI_CONTENT_FAILED", message=f"获取 anti-content 失败：{error.reason}")
    except Exception as error:  # noqa: BLE001
        return build_result(False, code="ANTI_CONTENT_FAILED", message=f"获取 anti-content 失败：{error}")

    anti_content = anti_payload.get("data") if isinstance(anti_payload, dict) else None
    if not anti_content:
        return build_result(
            False,
            code="ANTI_CONTENT_MISSING",
            message="未获取到 anti-content，无法完成在线检查",
            statusCode=anti_status,
            payload=anti_payload,
        )

    headers = {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9",
        "anti-content": str(anti_content),
        "cache-control": "max-age=0",
        "content-type": "application/json",
        "etag": etag_match.group(1),
        "origin": "https://mms.pinduoduo.com",
        "priority": "u=1, i",
        "referer": "https://mms.pinduoduo.com/orders/list?msfrom=mms_sidenav",
        "sec-ch-ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        "cookie": normalized_cookie,
    }

    payload = {
        "isSoldOut": False,
        "isOnsale": True,
    }

    try:
        status_code, response_payload = request_json(
            CHECK_URL,
            method="POST",
            headers=headers,
            payload=payload,
        )
    except urllib.error.HTTPError as error:
        error_payload = parse_json(error.read().decode("utf-8", errors="replace"))
        return build_result(
            True,
            online=False,
            message=extract_message(error_payload, f"检查接口返回 HTTP {error.code}"),
            statusCode=error.code,
            payload=error_payload,
        )
    except urllib.error.URLError as error:
        return build_result(False, code="CHECK_FAILED", message=f"检查在线状态失败：{error.reason}")
    except Exception as error:  # noqa: BLE001
        return build_result(False, code="CHECK_FAILED", message=f"检查在线状态失败：{error}")

    online = bool(
        isinstance(response_payload, dict)
        and response_payload.get("success") is True
        and int(response_payload.get("errorCode") or 0) == 1000000
    )

    return build_result(
        True,
        online=online,
        message="在线" if online else extract_message(response_payload, "不在线"),
        statusCode=status_code,
        payload=response_payload,
    )


def read_cookie_from_stdin():
    if sys.stdin.isatty():
        return ""

    raw = sys.stdin.read().strip()
    if not raw:
        return ""

    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            return str(payload.get("cookie1") or "").strip()
    except json.JSONDecodeError:
        pass

    return raw


def main():
    parser = argparse.ArgumentParser(description="检查指定 cookie1 对应店铺是否在线")
    parser.add_argument("--cookie", default="", help="直接传入 cookie1")
    args = parser.parse_args()

    cookie_value1 = str(args.cookie or "").strip() or read_cookie_from_stdin()
    result = is_login(cookie_value1)
    # Keep helper output ASCII-only so packaged Windows executables
    # stay parseable regardless of the active system code page.
    sys.stdout.write(json.dumps(result))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
