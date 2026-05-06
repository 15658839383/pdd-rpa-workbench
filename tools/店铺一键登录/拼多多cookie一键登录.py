import json
import socket
import sys
import time
from pathlib import Path

try:
    from DrissionPage import Chromium, ChromiumOptions
except Exception as import_error:  # pragma: no cover - runtime dependency guard
    Chromium = None
    ChromiumOptions = None
    DRISSION_IMPORT_ERROR = import_error
else:
    DRISSION_IMPORT_ERROR = None


LOGIN_URL = "https://mms.pinduoduo.com/home"
MMS_COOKIE_NAMES = {
    "_nano_fp",
    "JSESSIONID",
    "PASS_ID",
    "x-visit-time",
    "windows_app_shop_token_23",
}


def configure_stdio_utf8():
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None or not hasattr(stream, "reconfigure"):
            continue

        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            continue


def parse_cookie_string(cookie_string):
    cookies = {}
    if not cookie_string:
        return cookies

    for item in str(cookie_string).split(";"):
        item = item.strip()
        if not item or "=" not in item:
            continue

        key, value = item.split("=", 1)
        cookies[key.strip()] = value.strip()

    return cookies


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def sanitize_path_segment(value):
    text = str(value or "").strip() or "unknown-shop"
    blocked = '<>:"/\\|?*'
    return "".join("_" if char in blocked else char for char in text).strip() or "unknown-shop"


def read_payload():
    raw = sys.stdin.read().strip()
    if not raw:
        raise ValueError("未收到一键登录参数")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise ValueError("一键登录参数不是合法 JSON") from error

    if not isinstance(payload, dict):
        raise ValueError("一键登录参数格式不正确")

    return payload


def build_result(ok, **payload):
    return {
        "ok": bool(ok),
        **payload
    }


def emit_and_exit(result, exit_code=0):
    # Keep helper output ASCII-only so Electron can parse it reliably
    # even when the packaged Windows executable writes through a non-UTF-8 code page.
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()
    raise SystemExit(exit_code)


def main():
    configure_stdio_utf8()

    if Chromium is None or ChromiumOptions is None:
        emit_and_exit(
            build_result(
                False,
                code="DRISSION_NOT_AVAILABLE",
                message=f"未安装 DrissionPage 运行依赖：{DRISSION_IMPORT_ERROR}"
            ),
            exit_code=1
        )

    try:
        payload = read_payload()
    except Exception as error:
        emit_and_exit(
            build_result(False, code="INVALID_INPUT", message=str(error)),
            exit_code=1
        )

    shop_code = str(payload.get("shopCode") or "").strip()
    shop_name = str(payload.get("shopName") or "").strip() or shop_code or "未命名店铺"
    cookie1 = str(payload.get("cookie1") or "").strip()
    profile_root = str(payload.get("profileRoot") or "").strip()

    if not shop_code:
        emit_and_exit(build_result(False, code="SHOP_CODE_REQUIRED", message="缺少店铺编号"), exit_code=1)

    if not cookie1:
        emit_and_exit(build_result(False, code="COOKIE_MISSING", message="该店铺缺少 cookie1"), exit_code=1)

    if not profile_root:
        emit_and_exit(build_result(False, code="PROFILE_ROOT_MISSING", message="缺少浏览器资料目录"), exit_code=1)

    cookies = parse_cookie_string(cookie1)
    if not cookies:
        emit_and_exit(build_result(False, code="COOKIE_PARSE_FAILED", message="cookie1 解析后为空"), exit_code=1)

    profile_dir = Path(profile_root) / sanitize_path_segment(shop_code)
    profile_dir.mkdir(parents=True, exist_ok=True)

    browser = None
    try:
        options = ChromiumOptions(read_file=False).set_paths(
            user_data_path=str(profile_dir)
        ).set_local_port(find_free_port())
        browser = Chromium(addr_or_opts=options, session_options=False)
        tab = browser.new_tab()
        tab.set.activate()
        tab.set.load_mode.none()

        injected_count = 0
        for name, value in cookies.items():
            if not name or "mms_" in name:
                continue

            domain = "mms.pinduoduo.com" if name in MMS_COOKIE_NAMES else ".pinduoduo.com"
            tab.set.cookies({
                "name": name,
                "value": value,
                "domain": domain,
                "path": "/",
            })
            injected_count += 1

        if injected_count == 0:
            emit_and_exit(
                build_result(False, code="COOKIE_EMPTY", message="没有可注入的 cookies"),
                exit_code=1
            )

        try:
            # Best-effort navigation only: once the browser is open and cookies
            # are injected, we report success without waiting for page entry.
            tab.get(LOGIN_URL)
        except Exception:
            pass

        emit_and_exit(
            build_result(
                True,
                shopCode=shop_code,
                shopName=shop_name,
                launchedAt=time.strftime("%Y-%m-%dT%H:%M:%S"),
                message=f"店铺《{shop_name}》已打开浏览器并注入最新 cookies"
            )
        )
    except Exception as error:
        emit_and_exit(
            build_result(False, code="QUICK_LOGIN_FAILED", message=f"一键登录失败：{error}"),
            exit_code=1
        )


if __name__ == "__main__":
    main()
