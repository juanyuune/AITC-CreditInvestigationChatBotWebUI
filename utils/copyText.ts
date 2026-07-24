/**
 * copyText — works on HTTP LAN (192.168.x.x) and HTTPS alike.
 * navigator.clipboard requires secure context (HTTPS/localhost).
 * Falls back to execCommand for plain HTTP.
 */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // HTTP fallback — create offscreen textarea, select, copy
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("execCommand copy failed");
  } finally {
    document.body.removeChild(ta);
  }
}
