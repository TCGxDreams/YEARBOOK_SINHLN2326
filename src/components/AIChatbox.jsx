import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import './AIChatbox.css';

/* ─── Smart AI response engine ─────────────── */
const aiResponses = [
  {
    keywords: ['buồn', 'nhớ', 'thương', 'chia tay', 'xa'],
    responses: [
      'Mình hiểu cảm giác đó. Chia tay bạn bè thân là điều không dễ dàng. Hãy viết ra những kỷ niệm đẹp nhất mà bạn muốn lưu giữ nhé!',
      'Dù có xa nhau, tình bạn thật sự sẽ không bao giờ phai nhạt. Hãy kể cho mình nghe về người bạn mà bạn sẽ nhớ nhất?',
    ],
  },
  {
    keywords: ['vui', 'cười', 'hài', 'buồn cười', 'troll'],
    responses: [
      'Haha! Nghe vui quá! Đó chắc chắn là kỷ niệm đáng nhớ. Bạn có nhớ ai là "thủ phạm" gây ra chuyện buồn cười đó không?',
      'Những lúc cười nghiêng ngả cùng nhau chính là thanh xuân đẹp nhất đấy! Kể thêm chi tiết đi, mình muốn nghe!',
    ],
  },
  {
    keywords: ['cô', 'thầy', 'giáo viên', 'dạy', 'môn'],
    responses: [
      'Thầy cô là những người đã đồng hành cùng các bạn suốt 3 năm. Bạn có muốn viết lưu bút gửi thầy/cô không? Mình có thể gợi ý cách viết cho hay nhé!',
      'Kỷ niệm với thầy cô luôn đặc biệt. Bạn nhớ nhất tiết học nào? Hay khoảnh khắc nào thầy/cô làm cả lớp bất ngờ?',
    ],
  },
  {
    keywords: ['thi', 'học', 'điểm', 'ôn', 'bài', 'đại học'],
    responses: [
      'Những đêm thức trắng ôn bài cùng nhau — đó mới chính là kỷ niệm "đau thương" nhưng đáng nhớ nhất! Ai là người hay ngủ gật nhất khi học nhóm?',
      'Áp lực thi cử rồi cũng sẽ qua. Điều quan trọng là những người đã cùng bạn vượt qua. Hãy ghi lại cảm xúc đó trong lưu bút nhé!',
    ],
  },
  {
    keywords: ['sinh', 'ptnk', 'năng khiếu', 'lớp'],
    responses: [
      'SINHLN2326 — một cái tên mà mãi mãi sẽ gắn liền với thanh xuân! Bạn tự hào nhất về điều gì khi là thành viên của lớp?',
      'Lớp chuyên Sinh PTNK thì chắc hẳn có rất nhiều kỷ niệm trong phòng thí nghiệm rồi nhỉ? Kể cho mình nghe đi!',
    ],
  },
  {
    keywords: ['dã ngoại', 'chơi', 'đi', 'chuyến', 'trip'],
    responses: [
      'Những chuyến đi cùng lớp luôn là kỷ niệm tuyệt vời nhất! Bạn nhớ chuyến đi nào nhất? Có khoảnh khắc nào "huyền thoại" không?',
      'Mỗi chuyến đi là một câu chuyện. Bạn hãy viết lại chi tiết nhất có thể — vài năm sau đọc lại sẽ rất xúc động đấy!',
    ],
  },
];

const defaultResponses = [
  'Thật tuyệt! Hãy kể thêm chi tiết nhé — ai có mặt, ở đâu, lúc nào? Càng chi tiết thì lưu bút càng đáng nhớ!',
  'Nghe hay quá! Bạn có muốn viết kỷ niệm này thành một lời nhắn trong phần Lưu Bút không? Mình có thể giúp bạn chỉnh sửa cho thật hay.',
  'Mình thấy đây là kỷ niệm rất đáng để lưu giữ. Bạn thử nhớ lại xem lúc đó mình cảm thấy thế nào nhé — cảm xúc sẽ làm lưu bút thêm sống động!',
  'Wow, nghe thú vị lắm! Bạn có thể chia sẻ thêm về những người bạn đã cùng trải qua khoảnh khắc đó không?',
  'Đó chắc hẳn là một kỷ niệm không thể nào quên! Bạn muốn gửi lời nhắn này đến ai trong lớp? Mình sẽ giúp bạn viết thật hay.',
];

function getAIResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const group of aiResponses) {
    if (group.keywords.some(kw => lower.includes(kw))) {
      return group.responses[Math.floor(Math.random() * group.responses.length)];
    }
  }
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/* ─── Component ────────────────────────────── */
const AIChatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Chào bạn! Mình là AI hỗ trợ viết lưu bút của lớp SINHLN2326.\n\nMình có thể giúp bạn:\n• Gợi nhớ lại kỷ niệm đẹp\n• Gợi ý cách viết lưu bút\n• Kể chuyện về lớp mình\n\nBạn muốn kể về kỷ niệm nào?',
      isAi: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { id: Date.now(), text: userMsg, isAi: false }]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: getAIResponse(userMsg), isAi: true },
      ]);
    }, delay);
  };

  // Quick prompts
  const quickPrompts = [
    'Kỷ niệm vui nhất',
    'Nhớ thầy cô',
    'Chuyến dã ngoại',
  ];

  const handleQuickPrompt = (prompt) => {
    setInputText(prompt);
  };

  return (
    <>
      {/* Toggle button */}
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

      {/* Chat window */}
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
                  <span className="chatbox-name">AI Gợi Nhớ Kỷ Niệm</span>
                  <span className="chatbox-status">● Online</span>
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

            {/* Quick prompts */}
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
