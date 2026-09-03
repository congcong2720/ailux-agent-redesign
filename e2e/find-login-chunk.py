import re
import urllib.request

html = urllib.request.urlopen("https://test-agent.ailuxbio.com/login", timeout=30).read().decode()
print("HTML assets:", re.findall(r"/assets/[^\"']+", html))

js = urllib.request.urlopen(
    "https://test-agent.ailuxbio.com/assets/index-DsspbG7V.js", timeout=30
).read().decode("utf-8", "replace")
chunks = sorted(set(re.findall(r"[A-Za-z0-9_-]+-[A-Za-z0-9_-]{6,}\.js", js)))
print("chunk refs", len(chunks))

for c in chunks:
    url = "https://test-agent.ailuxbio.com/assets/" + c
    try:
        data = urllib.request.urlopen(url, timeout=20).read().decode("utf-8", "replace")
    except Exception:
        continue
    if "credential" in data and ("account" in data or "redirect_uri" in data or "redirectUri" in data):
        print("FOUND", c, "len", len(data))
        for key in ["credential", "account", "redirect_uri", "redirectUri", "authorize"]:
            i = data.find(key)
            if i >= 0:
                print("---", key, "---")
                print(data[max(0, i - 250) : i + 650])
        break
else:
    print("not found in first pass; scanning for login form markers")
    for c in chunks:
        url = "https://test-agent.ailuxbio.com/assets/" + c
        try:
            data = urllib.request.urlopen(url, timeout=15).read().decode("utf-8", "replace")
        except Exception:
            continue
        if "Please enter your email" in data or "请输入邮箱" in data or "passwordMinLength" in data:
            print("LOGIN UI CHUNK", c)
            print(data[:2000])
