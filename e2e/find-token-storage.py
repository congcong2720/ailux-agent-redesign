import re
import urllib.request

html = urllib.request.urlopen("https://test-agent.ailuxbio.com/login", timeout=30).read().decode(
    "utf-8", "replace"
)
scripts = re.findall(r"/assets/[^\"']+\.js", html)
print("scripts:", scripts[:15])

keys = [
    "access_token",
    "refresh_token",
    "Authorization",
    "Bearer",
    "setCookie",
    "document.cookie",
    "localStorage.setItem",
    "TOKEN_KEY",
    "token_key",
    "isAuthenticated",
]

for path in scripts:
    url = "https://test-agent.ailuxbio.com" + path
    print("\n===", path, "===")
    try:
        js = urllib.request.urlopen(url, timeout=60).read().decode("utf-8", "replace")
    except Exception as e:
        print("fail", e)
        continue
    for key in keys:
        idxs = [m.start() for m in re.finditer(re.escape(key), js)]
        if not idxs:
            continue
        print(f"\n{key} x{len(idxs)}")
        for i in idxs[:2]:
            print(js[max(0, i - 160) : i + 280])
            print("----")
