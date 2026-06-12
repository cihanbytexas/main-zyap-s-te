import { createClient } from '@supabase/supabase-js';

// KEY VE URL BİLGİLERİNİ BURAYA YAPIŞTIR
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";

// PATRONUN GİRECEĞİ ŞİFREYİ BURADAN BELİRLE
const ADMIN_PASSWORD = "Ozyapi2026"; 

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // GET isteği: Sadece güncel metni panele çekmek için
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('personality_text')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return res.status(200).json({ text: data.personality_text });
    } catch (err) {
      return res.status(500).json({ error: "Veri çekilemedi" });
    }
  } 
  
  // POST isteği: Patron yeni fiyatları kaydettiğinde
  if (req.method === "POST") {
    const { password, newText } = req.body;
    
    // Şifre kontrolü
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Hatalı şifre! Lütfen tekrar deneyin." });
    }

    try {
      const { error } = await supabase
        .from('bot_settings')
        .update({ personality_text: newText })
        .eq('id', 1);
      
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Fiyatlar başarıyla güncellendi!" });
    } catch (err) {
      return res.status(500).json({ error: "Güncelleme sırasında bir hata oluştu." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
