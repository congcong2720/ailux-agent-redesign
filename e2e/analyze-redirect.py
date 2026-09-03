import re
import urllib.request

data = urllib.request.urlopen(
    "https://test-agent.ailuxbio.com/assets/index-C_cBW-el.js", timeout=30
).read().decode("utf-8", "replace")

j = data.find("redirect_url")
print("redirect_url context:\n", data[j - 600 : j + 900])

print("\nURLs:")
for u in sorted(set(re.findall(r"https://[A-Za-z0-9._\-/:?&=%#]+", data))):
    print(u)

# Af definition
for pat in [r"function Af\(", r"Af=function", r"Af=", r"const Af", r"Af=async"]:
    m = re.search(pat, data)
    print("pat", pat, "->", m.start() if m else None)

# Search axios post to authorize path construction
for key in ["xops/oauth2", "authorize", "Af("]:
    idxs = [m.start() for m in re.finditer(re.escape(key), data)]
    print(key, idxs[:5])
    if idxs:
        i = idxs[0]
        print(data[max(0, i - 200) : i + 500])
        print("----")
