import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { localMembers, extractMshs, validMshsList, ADMIN_MSHS } from '../data/members';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Lấy thông tin member từ Supabase, fallback local
  async function fetchMember(email) {
    const mshs = extractMshs(email);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mshs', mshs)
        .single();

      if (data && !error) {
        setMember(data);
        setIsAdmin(data.role === 'admin');
        return;
      }
    } catch (e) {
      // Supabase chưa sẵn sàng
    }
    // Fallback local
    const local = localMembers.find(m => m.mshs === mshs);
    if (local) {
      setMember(local);
      setIsAdmin(local.mshs === ADMIN_MSHS);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchMember(u.email);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchMember(u.email);
      } else {
        setMember(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(mshs, password) {
    if (!validMshsList.includes(mshs)) {
      return { error: { message: 'MSHS không tồn tại trong lớp SINHLN2326!' } };
    }

    const email = `student${mshs}@ptnk.edu.vn`;

    // Thử đăng nhập
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // Tự đăng ký nếu chưa có
    if (error && (error.message.includes('Invalid login') || error.message.includes('invalid_credentials'))) {
      const local = localMembers.find(m => m.mshs === mshs);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { mshs, full_name: local?.full_name || '' } }
      });
      if (signUpError) return { error: signUpError };

      const result = await supabase.auth.signInWithPassword({ email, password });
      return result;
    }

    return { data, error };
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setMember(null);
    setIsAdmin(false);
  }

  // Cập nhật profile (nickname, quote, bio)
  async function updateProfile(updates) {
    if (!member) return { error: { message: 'Chưa đăng nhập' } };
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('mshs', member.mshs)
        .select()
        .single();

      if (!error && data) {
        setMember(data);
        return { data };
      }
      return { error };
    } catch (e) {
      return { error: { message: e.message } };
    }
  }

  return (
    <AuthContext.Provider value={{ user, member, loading, isAdmin, login, logout, updateProfile, fetchMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
