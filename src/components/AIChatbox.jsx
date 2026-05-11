import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Wifi, WifiOff } from 'lucide-react';
import SYSTEM_PROMPT from '../data/system_prompt.md?raw';
import './AIChatbox.css';

/* ─── Gemini API Config ────────────────────── */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  : null;

/* ─── Fallback: Local keyword-based responses ─── */
const aiResponses = [
  {
    keywords: ['buồn', 'nhớ', 'thương', 'chia tay', 'xa'],
    responses: [
      'Mình hiểu cảm giác đó. Chia tay bạn bè thân là điều không dễ dàng. Hãy viết ra những kỷ niệm đẹp nhất mà bạn muốn lưu giữ nhé! 💙',
      'Dù có xa nhau, tình bạn thật sự sẽ không bao giờ phai nhạt. Hãy kể cho mình nghe về người bạn mà bạn sẽ nhớ nhất?',
    ],
  },
  {
    keywords: ['vui', 'cười', 'hài', 'buồn cười', 'troll'],
    responses: [
      'Haha! Nghe vui quá! Đó chắc chắn là kỷ niệm đáng nhớ 😂 Bạn có nhớ ai là "thủ phạm" gây ra chuyện buồn cười đó không?',
      'Những lúc cười nghiêng ngả cùng nhau chính là thanh xuân đẹp nhất đấy! Kể thêm chi tiết đi, mình muốn nghe!',
    ],
  },
  {
    keywords: ['cô', 'thầy', 'giáo viên', 'dạy', 'môn', 'quang', 'linh', 'duy'],
    responses: [
      'Thầy cô là những người đã đồng hành cùng các bạn suốt 3 năm. Bạn có muốn viết lưu bút gửi thầy/cô không? Mình có thể gợi ý cách viết cho hay nhé! ✍️',
      'Kỷ niệm với thầy cô luôn đặc biệt. Bạn nhớ nhất tiết học nào? Hay khoảnh khắc nào thầy/cô làm cả lớp bất ngờ?',
    ],
  },
  {
    keywords: ['thi', 'học', 'điểm', 'ôn', 'bài', 'đại học'],
    responses: [
      'Những đêm thức trắng ôn bài cùng nhau — đó mới chính là kỷ niệm "đau thương" nhưng đáng nhớ nhất! 📚 Ai là người hay ngủ gật nhất khi học nhóm?',
      'Áp lực thi cử rồi cũng sẽ qua. Điều quan trọng là những người đã cùng bạn vượt qua. Hãy ghi lại cảm xúc đó trong lưu bút nhé!',
    ],
  },
  {
    keywords: ['sinh', 'ptnk', 'năng khiếu', 'lớp'],
    responses: [
      'SINHLN2326 — một cái tên mà mãi mãi sẽ gắn liền với thanh xuân! 💫 Bạn tự hào nhất về điều gì khi là thành viên của lớp?',
      'Lớp chuyên Sinh PTNK thì chắc hẳn có rất nhiều kỷ niệm trong phòng thí nghiệm rồi nhỉ? 🔬 Kể cho mình nghe đi!',
    ],
  },
  {
    keywords: ['dã ngoại', 'chơi', 'đi', 'chuyến', 'trip'],
    responses: [
      'Những chuyến đi cùng lớp luôn là kỷ niệm tuyệt vời nhất! 🌄 Bạn nhớ chuyến đi nào nhất? Có khoảnh khắc nào "huyền thoại" không?',
      'Mỗi chuyến đi là một câu chuyện. Bạn hãy viết lại chi tiết nhất có thể — vài năm sau đọc lại sẽ rất xúc động đấy!',
    ],
  },
];

const defaultResponses = [
  'Thật tuyệt! Hãy kể thêm chi tiết nhé — ai có mặt, ở đâu, lúc nào? Càng chi tiết thì lưu bút càng đáng nhớ! ✨',
  'Nghe hay quá! Bạn có muốn viết kỷ niệm này thành một lời nhắn trong phần Lưu Bút không?',
  'Mình thấy đây là kỷ niệm rất đáng để lưu giữ. Bạn thử nhớ lại xem lúc đó mình cảm thấy thế nào nhé 💭',
  'Wow, nghe thú vị lắm! Bạn có thể chia sẻ thêm về những người bạn đã cùng trải qua khoảnh khắc đó không?',
  'Đó chắc hẳn là một kỷ niệm không thể nào quên! Bạn muốn gửi lời nhắn này đến ai trong lớp?',
];

function getLocalResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const group of aiResponses) {
    if (group.keywords.some(kw => lower.includes(kw))) {
      return group.responses[Math.floor(Math.random() * group.responses.length)];
    }
  }
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/* ─── Gemini API call ──────────────────────── */
async function getGeminiResponse(conversationHistory) {
  if (!GEMINI_URL) {
    console.warn('[AIChatbox] VITE_GEMINI_API_KEY không tồn tại, dùng chế độ offline.');
    return null;
  }

  try {
    const contents = conversationHistory.map(msg => ({
      role: msg.isAi ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.85,
          topP: 0.95,
          maxOutputTokens: 300,
          thinkingConfig: {
            thinkingLevel: 'MINIMAL',
          },
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AIChatbox] Gemini API lỗi:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[AIChatbox] Gemini trả về rỗng:', data);
      return null;
    }

    return text;
  } catch (err) {
    console.error('[AIChatbox] Không thể kết nối Gemini:', err.message);
    return null;
  }
}

/* ─── Component ────────────────────────────── */
const AIChatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Chào bạn! Mình là "Nhớ Ơi" — AI hỗ trợ viết lưu bút của lớp SINHLN2326 💙\n\nMình có thể giúp bạn:\n• Gợi nhớ lại kỷ niệm đẹp\n• Gợi ý cách viết lưu bút thật hay\n• Kể chuyện về lớp mình\n\nBạn muốn kể về kỷ niệm nào?',
      isAi: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeminiConnected, setIsGeminiConnected] = useState(!!GEMINI_API_KEY);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    const newUserMessage = { id: Date.now(), text: userMsg, isAi: false };
    const updatedMessages = [...messages, newUserMessage];

    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    let aiText = null;

    // Thử gọi Gemini trước
    if (isGeminiConnected) {
      const recentHistory = updatedMessages.slice(-10);
      aiText = await getGeminiResponse(recentHistory);

      if (!aiText) {
        console.warn('[AIChatbox] Gemini thất bại → chuyển sang chế độ offline (keywords).');
        setIsGeminiConnected(false);
      }
    }

    // Fallback: dùng keyword-based responses
    if (!aiText) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
      aiText = getLocalResponse(userMsg);
    }

    setIsTyping(false);
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, text: aiText, isAi: true },
    ]);
  };

  const quickPrompts = [
    'Kỷ niệm vui nhất',
    'Nhớ thầy cô',
    'Chuyến dã ngoại',
    'Viết lưu bút cho bạn thân',
  ];

  const handleQuickPrompt = (prompt) => {
    setInputText(prompt);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chatbox-toggle"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Sparkles size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbox-window glass-card"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="chatbox-header">
              <div className="chatbox-title">
                <div className="chatbox-avatar">
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className="chatbox-name">Nhớ Ơi — AI Lưu Bút</span>
                  <span className="chatbox-status">
                    {isGeminiConnected ? (
                      <><Wifi size={10} style={{ marginRight: 4 }} /> Gemini AI</>
                    ) : (
                      <><WifiOff size={10} style={{ marginRight: 4 }} /> Offline</>
                    )}
                  </span>
                </div>
              </div>
              <button className="chatbox-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="chatbox-messages">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`chat-message ${msg.isAi ? 'ai' : 'user'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.isAi && <div className="ai-avatar"><Sparkles size={12} /></div>}
                  <div className="message-bubble">
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="chat-message ai">
                  <div className="ai-avatar"><Sparkles size={12} /></div>
                  <div className="message-bubble typing-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className="quick-prompts">
                {quickPrompts.map((p) => (
                  <button key={p} className="quick-prompt-btn" onClick={() => handleQuickPrompt(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            <form className="chatbox-input" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Kể về một kỷ niệm..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
              />
              <button type="submit" className="send-btn" disabled={isTyping || !inputText.trim()}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbox;
