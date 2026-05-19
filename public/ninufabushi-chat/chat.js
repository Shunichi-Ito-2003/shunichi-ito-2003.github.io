/* ===========================
   にぬふぁぶしBot — フロントエンドチャット
   =========================== */

// Cloudflare WorkersのエンドポイントURL（2026-05-12 デプロイ済み）
const API_ENDPOINT = "https://ninufabushi-bot.icchi7777.workers.dev/chat";

// 会話履歴（直近5往復＝10メッセージまで保持してAPIに送る）
const MAX_HISTORY = 10;
const conversationHistory = [];

// DOM 要素
const chatArea = document.getElementById("chatArea");
const inputForm = document.getElementById("inputForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// ===== UI ヘルパー =====
function appendMessage(role, text, options = {}) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  if (options.error) div.classList.add("error");

  // 改行をpタグに変換（簡易マークダウンとして「**bold**」は <strong> に）
  const paragraphs = text.split("\n").filter(p => p.trim());
  paragraphs.forEach(p => {
    const para = document.createElement("p");
    para.innerHTML = p
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    div.appendChild(para);
  });

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

function showThinking() {
  const div = document.createElement("div");
  div.className = "message bot thinking-msg";
  div.innerHTML = '<p><span class="thinking">考え中</span></p>';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

function setSending(isSending) {
  sendButton.disabled = isSending;
  messageInput.disabled = isSending;
  sendButton.textContent = isSending ? "送信中..." : "送信";
}

// ===== API 呼び出し =====
async function sendToAPI(userMessage) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userMessage,
      history: conversationHistory.slice(-MAX_HISTORY),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data.reply) {
    throw new Error("APIから応答が返ってきませんでした");
  }
  return data.reply;
}

// ===== フォーム送信 =====
async function handleSubmit(event) {
  event.preventDefault();
  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  conversationHistory.push({ role: "user", content: userMessage });
  messageInput.value = "";
  setSending(true);

  const thinkingDiv = showThinking();

  try {
    const reply = await sendToAPI(userMessage);
    thinkingDiv.remove();
    appendMessage("bot", reply);
    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    thinkingDiv.remove();
    appendMessage(
      "bot",
      `ごめん、通信エラーが起きたみたい。\nもう一度試してみるか、いっちー本人に直接聞いてみて。\n\n(詳細: ${err.message})`,
      { error: true }
    );
    console.error(err);
  } finally {
    setSending(false);
    messageInput.focus();
  }
}

// ===== キーボード =====
// 日本語IME対応：変換確定のEnterと送信のEnterを分離する
let lastCompositionEnd = 0;

messageInput.addEventListener("compositionstart", () => {
  // IME入力開始
});

messageInput.addEventListener("compositionend", () => {
  // IME確定の瞬間を記録
  lastCompositionEnd = Date.now();
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.shiftKey) return;
  // 1) IME変換中の Enter は無視
  if (e.isComposing || e.keyCode === 229) return;
  // 2) IME確定直後（300ms以内）の Enter も無視
  //    → 変換確定の Enter で送信されてしまうのを防ぐ
  if (Date.now() - lastCompositionEnd < 300) return;
  // 上記をすべてパスした Enter のみ送信
  e.preventDefault();
  inputForm.requestSubmit();
});

// 自動リサイズ（入力欄を内容に応じて伸ばす）
messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
});

inputForm.addEventListener("submit", handleSubmit);

// 初期フォーカス
messageInput.focus();
