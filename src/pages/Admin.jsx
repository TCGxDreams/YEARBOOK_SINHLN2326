import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, MessageSquare, Image as ImageIcon, Trash2, Search, RefreshCw, Edit3, Save, X, Loader2, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Panel.css';

const Admin = () => {
  const { isAdmin, member } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true });
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'members') fetchMembers();
      else if (activeTab === 'messages') fetchMessages();
      else fetchGallery();
    }
  }, [activeTab, isAdmin]);

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase.from('members').select('*').order('mshs');
    setMembers(data || []);
    setLoading(false);
  }

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  }

  async function fetchGallery() {
    setLoading(true);
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    setGallery(data || []);
    setLoading(false);
  }

  async function handleEditMember(m) {
    setEditingId(m.mshs);
    setEditForm({ nickname: m.nickname || '', quote: m.quote || '', bio: m.bio || '', role: m.role || 'member' });
  }

  async function handleSaveMember(mshs) {
    setSaving(true);
    await supabase.from('members').update(editForm).eq('mshs', mshs);
    setEditingId(null);
    setSaving(false);
    fetchMembers();
  }

  async function handleDeleteMessage(id) {
    await supabase.from('messages').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchMessages();
  }

  async function handleDeletePhoto(id) {
    await supabase.from('gallery').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchGallery();
  }

  async function handleEditCaption(photo) {
    setEditingId(photo.id);
    setEditForm({ caption: photo.caption || '', category: photo.category || 'other' });
  }

  async function handleSaveCaption(id) {
    setSaving(true);
    await supabase.from('gallery').update({ caption: editForm.caption, category: editForm.category }).eq('id', id);
    setEditingId(null);
    setSaving(false);
    fetchGallery();
  }

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) || m.mshs.includes(search)
  );

  if (!isAdmin) return null;

  return (
    <div className="page-container container section">
      <motion.div className="page-header text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">
          <Shield size={32} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Admin Panel
        </h1>
        <p className="page-subtitle">Quản lý toàn bộ — Chỉ dành cho {member?.full_name}</p>
      </motion.div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          <Users size={18} /> Thành Viên
        </button>
        <button className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          <MessageSquare size={18} /> Lưu Bút
        </button>
        <button className={`admin-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
          <ImageIcon size={18} /> Kỷ Niệm
        </button>
      </div>

      {/* ════════ MEMBERS TAB ════════ */}
      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="admin-toolbar">
            <div className="search-bar glass" style={{ margin: 0, maxWidth: '350px' }}>
              <Search size={18} />
              <input placeholder="Tìm theo tên hoặc MSHS..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-outline btn-sm" onClick={fetchMembers}><RefreshCw size={16} /> Làm mới</button>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: '3rem' }}><Loader2 size={28} className="spin-icon" /></div>
          ) : (
            <div className="admin-table-wrapper glass-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>MSHS</th>
                    <th>Họ tên</th>
                    <th>Biệt danh</th>
                    <th>Châm ngôn</th>
                    <th>Vai trò</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.mshs} className={m.role === 'admin' ? 'admin-row' : ''}>
                      <td className="mshs-cell">{m.mshs}</td>
                      <td><div className="member-cell"><div className="cell-avatar" style={{ background: m.color }}>{m.short_name?.charAt(0)}</div>{m.full_name}</div></td>
                      {editingId === m.mshs ? (
                        <>
                          <td><input className="table-input" value={editForm.nickname} onChange={e => setEditForm(p => ({ ...p, nickname: e.target.value }))} /></td>
                          <td><input className="table-input" value={editForm.quote} onChange={e => setEditForm(p => ({ ...p, quote: e.target.value }))} /></td>
                          <td>
                            <select className="table-input" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button className="action-btn save" onClick={() => handleSaveMember(m.mshs)} disabled={saving}>
                                {saving ? <Loader2 size={14} className="spin-icon" /> : <Save size={14} />}
                              </button>
                              <button className="action-btn cancel" onClick={() => setEditingId(null)}><X size={14} /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="muted">{m.nickname || '—'}</td>
                          <td className="muted quote-cell">{m.quote || '—'}</td>
                          <td><span className={`role-tag ${m.role}`}>{m.role === 'admin' ? 'Admin' : 'Member'}</span></td>
                          <td><button className="action-btn edit" onClick={() => handleEditMember(m)}><Edit3 size={14} /></button></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ════════ MESSAGES TAB ════════ */}
      {activeTab === 'messages' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="admin-toolbar">
            <span className="toolbar-info">{messages.length} lưu bút</span>
            <button className="btn btn-outline btn-sm" onClick={fetchMessages}><RefreshCw size={16} /> Làm mới</button>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: '3rem' }}><Loader2 size={28} className="spin-icon" /></div>
          ) : (
            <div className="admin-messages-list">
              {messages.map(msg => (
                <motion.div key={msg.id} className="admin-message-card glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="admin-msg-header">
                    <div>
                      <strong>{msg.author}</strong>
                      {msg.author_mshs && <span className="msg-mshs">({msg.author_mshs})</span>}
                      <span className="msg-arrow">→</span>
                      <span className="msg-recipient">{msg.recipient}</span>
                    </div>
                    <span className="msg-date">{new Date(msg.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="admin-msg-content">{msg.content}</p>
                  <div className="admin-msg-footer">
                    <span className="msg-likes"><Heart size={14} /> {msg.likes || 0}</span>
                    {deleteConfirm === msg.id ? (
                      <div className="delete-confirm">
                        <span>Xóa?</span>
                        <button className="action-btn delete" onClick={() => handleDeleteMessage(msg.id)}>Xóa</button>
                        <button className="action-btn cancel" onClick={() => setDeleteConfirm(null)}>Hủy</button>
                      </div>
                    ) : (
                      <button className="action-btn delete" onClick={() => setDeleteConfirm(msg.id)}><Trash2 size={14} /> Xóa</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ════════ GALLERY TAB ════════ */}
      {activeTab === 'gallery' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="admin-toolbar">
            <span className="toolbar-info">{gallery.length} ảnh kỷ niệm</span>
            <button className="btn btn-outline btn-sm" onClick={fetchGallery}><RefreshCw size={16} /> Làm mới</button>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: '3rem' }}><Loader2 size={28} className="spin-icon" /></div>
          ) : (
            <div className="admin-gallery-grid">
              {gallery.map(photo => (
                <motion.div key={photo.id} className="admin-photo-card glass-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="admin-photo-img">
                    <img src={photo.image_url} alt={photo.caption} loading="lazy" />
                  </div>
                  <div className="admin-photo-info">
                    {editingId === photo.id ? (
                      <div className="admin-photo-edit">
                        <input className="table-input" placeholder="Mô tả..." value={editForm.caption} onChange={e => setEditForm(p => ({ ...p, caption: e.target.value }))} />
                        <select className="table-input" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                          <option value="school">Trường lớp</option>
                          <option value="trip">Dã ngoại</option>
                          <option value="hangout">Tụ tập</option>
                          <option value="event">Sự kiện</option>
                          <option value="other">Khác</option>
                        </select>
                        <div className="table-actions">
                          <button className="action-btn save" onClick={() => handleSaveCaption(photo.id)} disabled={saving}>
                            {saving ? <Loader2 size={14} className="spin-icon" /> : <Save size={14} />} Lưu
                          </button>
                          <button className="action-btn cancel" onClick={() => setEditingId(null)}><X size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="admin-photo-caption">{photo.caption || 'Chưa có mô tả'}</p>
                        <div className="admin-photo-meta">
                          <span className="photo-category-tag">{photo.category}</span>
                          <span><ImageIcon size={14} /> {photo.uploaded_by_name || photo.uploaded_by}</span>
                          <span><Heart size={14} /> {photo.likes || 0}</span>
                        </div>
                        <div className="admin-photo-actions">
                          <button className="action-btn edit" onClick={() => handleEditCaption(photo)}><Edit3 size={14} /> Sửa</button>
                          {deleteConfirm === photo.id ? (
                            <div className="delete-confirm">
                              <button className="action-btn delete" onClick={() => handleDeletePhoto(photo.id)}>Xóa</button>
                              <button className="action-btn cancel" onClick={() => setDeleteConfirm(null)}>Hủy</button>
                            </div>
                          ) : (
                            <button className="action-btn delete" onClick={() => setDeleteConfirm(photo.id)}><Trash2 size={14} /> Xóa</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Admin;
