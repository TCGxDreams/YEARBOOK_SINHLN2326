import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X, Shield, Key, Quote, BookOpen, Loader2, CheckCircle, Camera, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Panel.css';

const Profile = () => {
  const { member, isAdmin, updateProfile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pwData, setPwData] = useState({ newPw: '', confirmPw: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    nickname: '',
    quote: '',
    bio: '',
  });

  useEffect(() => {
    if (member) {
      setForm({
        nickname: member.nickname || '',
        quote: member.quote || '',
        bio: member.bio || '',
      });
    }
  }, [member]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      nickname: form.nickname,
      quote: form.quote,
      bio: form.bio,
    });
    setSaving(false);
    if (!error) {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh quá lớn! Tối đa 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `avatars/${member.mshs}_${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // Update member record
      await supabase.from('members')
        .update({ avatar_url: publicUrl })
        .eq('mshs', member.mshs);

      // Refresh
      await updateProfile({ avatar_url: publicUrl });
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Không thể upload ảnh. Thử lại sau!');
    }
    setUploadingAvatar(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (pwData.newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }
    if (pwData.newPw !== pwData.confirmPw) {
      setPwMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    try {
      // Refresh session trước khi đổi mật khẩu
      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) {
        setPwMsg({ type: 'error', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại để đổi mật khẩu!' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: pwData.newPw });
      if (error) {
        // Xử lý lỗi 403 / session hết hạn
        if (error.status === 403 || error.message?.includes('403')) {
          setPwMsg({ type: 'error', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại để đổi mật khẩu!' });
        } else {
          setPwMsg({ type: 'error', text: error.message });
        }
      } else {
        setPwMsg({ type: 'success', text: 'Đã đổi mật khẩu thành công!' });
        setPwData({ newPw: '', confirmPw: '' });
        setChangingPw(false);
      }
    } catch (err) {
      setPwMsg({ type: 'error', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại!' });
    }
  };

  if (!member) return null;

  const hasAvatar = member.avatar_url && member.avatar_url.length > 0;

  return (
    <div className="page-container container section">
      <motion.div
        className="page-header text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">Trang Cá Nhân</h1>
        <p className="page-subtitle">Quản lý thông tin và tùy chỉnh hồ sơ của bạn</p>
      </motion.div>

      <div className="panel-grid">
        {/* ── Profile Card ────────────────────── */}
        <motion.div
          className="panel-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="panel-card-header">
            <User size={20} />
            <h2>Thông Tin</h2>
            {isAdmin && (
              <span className="admin-badge">
                <Shield size={12} /> Admin
              </span>
            )}
          </div>

          <div className="profile-hero">
            {/* Avatar with upload */}
            <div className="profile-avatar-wrapper">
              {hasAvatar ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="profile-avatar-img"
                />
              ) : (
                <div
                  className="profile-avatar"
                  style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}88)` }}
                >
                  <span>{member.short_name?.charAt(0)}</span>
                </div>
              )}
              <button
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Đổi ảnh đại diện"
              >
                {uploadingAvatar ? <Loader2 size={14} className="spin-icon" /> : <Camera size={14} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
            <h3 className="profile-name">{member.full_name}</h3>
            <p className="profile-mshs">MSHS: {member.mshs}</p>
            {member.nickname && <p className="profile-nickname">"{member.nickname}"</p>}
          </div>

          <div className="profile-details">
            <div className="profile-detail-row">
              <span className="detail-label">Lớp</span>
              <span className="detail-value">12 SINH-LN</span>
            </div>
            <div className="profile-detail-row">
              <span className="detail-label">Trường</span>
              <span className="detail-value">PTNK — ĐHQG TP.HCM</span>
            </div>
            <div className="profile-detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">student{member.mshs}@ptnk.edu.vn</span>
            </div>
            <div className="profile-detail-row">
              <span className="detail-label">Vai trò</span>
              <span className="detail-value">{isAdmin ? 'Quản trị viên' : 'Thành viên'}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Edit Profile ────────────────────── */}
        <motion.div
          className="panel-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="panel-card-header">
            <Edit3 size={20} />
            <h2>Chỉnh Sửa Hồ Sơ</h2>
            {saved && (
              <span className="save-badge">
                <CheckCircle size={14} /> Đã lưu!
              </span>
            )}
          </div>

          <div className="edit-form">
            <div className="form-group">
              <label><Quote size={14} /> Biệt danh</label>
              <input
                type="text"
                placeholder="VD: Nhân Cute, Boss,..."
                value={form.nickname}
                onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label><BookOpen size={14} /> Châm ngôn</label>
              <input
                type="text"
                placeholder="Một câu nói yêu thích..."
                value={form.quote}
                onChange={e => setForm(p => ({ ...p, quote: e.target.value }))}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label><Edit3 size={14} /> Giới thiệu bản thân</label>
              <textarea
                placeholder="Vài dòng về bản thân..."
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                disabled={!editing}
              />
            </div>

            <div className="edit-actions">
              {editing ? (
                <>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button className="btn btn-outline" onClick={() => { setEditing(false); setForm({ nickname: member.nickname || '', quote: member.quote || '', bio: member.bio || '' }); }}>
                    <X size={16} /> Hủy
                  </button>
                </>
              ) : (
                <button className="btn btn-outline" onClick={() => setEditing(true)}>
                  <Edit3 size={16} /> Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Change Password ─────────────────── */}
        <motion.div
          className="panel-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="panel-card-header">
            <Key size={20} />
            <h2>Đổi Mật Khẩu</h2>
          </div>

          {!changingPw ? (
            <div className="pw-inactive">
              <p style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  ⚠️ Cảnh báo bảo mật
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Bạn hãy đổi mật khẩu mới để bảo vệ tài khoản của mình nhé!
                </span>
              </p>
              <button className="btn btn-outline" onClick={() => setChangingPw(true)}>
                <Key size={16} /> Đổi mật khẩu
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="edit-form">
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Ít nhất 6 ký tự..."
                  value={pwData.newPw}
                  onChange={e => setPwData(p => ({ ...p, newPw: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu..."
                  value={pwData.confirmPw}
                  onChange={e => setPwData(p => ({ ...p, confirmPw: e.target.value }))}
                  required
                />
              </div>

              {pwMsg.text && (
                <div className={`pw-message ${pwMsg.type}`}>
                  {pwMsg.text}
                </div>
              )}

              <div className="edit-actions">
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Xác nhận
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setChangingPw(false); setPwMsg({ type: '', text: '' }); }}>
                  <X size={16} /> Hủy
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
