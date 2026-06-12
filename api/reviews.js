import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const ADMIN_PASSWORD = "Ozyapi2026"; 

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  
  // ===================================================
  // 1. GET İSTEKLERİ (Yorumları Listeleme)
  // ===================================================
  if (req.method === "GET") {
    const { action, password } = req.query;

    // A) ADMİN PANELİ İÇİN LİSTELEME (Şifre Korumalı)
    if (action === "admin_list") {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Yetkisiz erişim!" });
      }
      try {
        // Hem bekleyenleri hem onaylananları çekiyoruz
        const { data: pending } = await supabase.from('yorumlar').select('*').eq('onay_durumu', 'beklemede').order('created_at', { ascending: false });
        const { data: approved } = await supabase.from('yorumlar').select('*').eq('onay_durumu', 'onaylandi').order('created_at', { ascending: false });
        return res.status(200).json({ pending: pending || [], approved: approved || [] });
      } catch (err) {
        return res.status(500).json({ error: "Veritabanı hatası" });
      }
    }

    // B) ANA SAYFA İÇİN LİSTELEME (Herkese Açık - Sadece Onaylılar)
    try {
      const { data, error } = await supabase
        .from('yorumlar')
        .select('*')
        .eq('onay_durumu', 'onaylandi')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: "Yorumlar çekilemedi." });
    }
  }

  // ===================================================
  // 2. POST İSTEKLERİ (Ekleme, Onaylama, Silme)
  // ===================================================
  if (req.method === "POST") {
    const { action, password, id, ad_soyad, kategori, puan, yorum_metni } = req.body;

    // A) ADMİN: YORUM ONAYLAMA
    if (action === "approve") {
      if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Yetkisiz işlem!" });
      try {
        const { error } = await supabase.from('yorumlar').update({ onay_durumu: 'onaylandi' }).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: "Yorum onaylandı!" });
      } catch (err) { return res.status(500).json({ error: "Güncellenemedi." }); }
    }

    // B) ADMİN: YORUM SİLME (REDDET/KALDIR)
    if (action === "delete") {
      if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Yetkisiz işlem!" });
      try {
        const { error } = await supabase.from('yorumlar').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: "Yorum silindi!" });
      } catch (err) { return res.status(500).json({ error: "Silinemedi." }); }
    }

    // C) KULLANICI: YENİ YORUM GÖNDERME (Herkese Açık)
    if (!ad_soyad || !kategori || !puan || !yorum_metni) {
      return res.status(400).json({ error: "Lütfen tüm alanları doldurun." });
    }
    try {
      const { error } = await supabase.from('yorumlar').insert([{
        ad_soyad,
        kategori,
        puan: parseInt(puan),
        yorum_metni,
        onay_durumu: 'beklemede' // Varsayılan olarak onay bekliyor
      }]);
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Yorumunuz alındı, onay sonrası yayınlanacaktır." });
    } catch (err) {
      return res.status(500).json({ error: "Yorum gönderilirken hata oluştu." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
