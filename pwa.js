(function () {
"use strict";
/* ==========================================================================
   PWA 助手 —— index.html（官网）与 clock.html（时钟本体）共用
     NixiePWA.register()              注册 Service Worker
     NixiePWA.standalone()            是否已作为应用运行
     NixiePWA.attach(btn, options)    把「下载到桌面」按钮接上 beforeinstallprompt
       options.autoShow  仅在可安装时显示按钮（时钟页用）
       options.hint      兜底提示节点，支持 `hintText` 覆盖文案
   ========================================================================== */
let deferredPrompt = null;
const buttons = new Set();

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

function hintText() {
  return isIOS()
    ? "在 Safari 中点击「分享」→「添加到主屏幕」，即可把时钟装到桌面。"
    : "在浏览器菜单中选择「安装应用 / 添加到个人电脑」，即可把时钟装到桌面。";
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  for (const b of buttons) if (b.autoShow) b.node.classList.add("show");
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  for (const b of buttons) b.node.classList.remove("show");
});

function attach(node, options) {
  if (!node) return;
  const opts = options || {};
  const entry = { node, autoShow: !!opts.autoShow };
  buttons.add(entry);
  if (opts.autoShow && !standalone()) {
    /* 拿不到 beforeinstallprompt（Safari / 已安装 / 非 https）时也给一个入口 */
    setTimeout(() => { if (!standalone()) node.classList.add("show"); }, 2200);
  }
  node.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const res = await deferredPrompt.userChoice;
      if (res && res.outcome === "accepted") node.classList.remove("show");
      deferredPrompt = null;
      return;
    }
    const hint = opts.hint;
    if (!hint) return;
    hint.textContent = opts.hintText || hintText();
    hint.classList.add("show");
    clearTimeout(hint._t);
    hint._t = setTimeout(() => hint.classList.remove("show"), 6500);
  });
}

function register() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol.indexOf("http") !== 0) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

window.NixiePWA = { register, attach, standalone, isIOS };
})();
