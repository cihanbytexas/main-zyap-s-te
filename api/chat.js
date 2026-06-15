import { createClient } from '@supabase/supabase-js';

// KEY VE URL BİLGİLERİ
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";

// SADECE BİR KERE TANIMLANIYOR
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { message, username } = req.body;

  try {
    // 1. Supabase'den güncel personality metnini çekiyoruz
    const { data, error } = await supabase
      .from('bot_settings')
      .select('personality_text')
      .eq('id', 1)
      .single();

    if (error) {
      console.error("Supabase Çekim Hatası:", error);
      throw new Error("Veritabanından bot ayarları alınamadı.");
    }

    const currentPersonality = data.personality_text;

    // 2. Yapay Zeka API'sine güncel metin ile isteği atıyoruz
    const response = await fetch("https://grokenforceplus.vercel.app/api/enforce-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_name: username || "Ziyaretçi", // Sabit isim yerine dinamik fallback eklendi
          message: message,
          personality: currentPersonality
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Yanıt Hatası:", errorText);
      return res.status(response.status).json({
        error: "Yapay zeka API'si şu an cevap veremiyor."
      });
    }

    const apiData = await response.json();

    return res.status(200).json({
      reply: apiData.reply || "Cevap alınamadı"
    });

  } catch (err) {
    // Vercel loglarında hatayı tam görebilmek için konsola yazdırıyoruz
    console.error("Chat İşlemi Kritik Hata:", err);

    return res.status(500).json({
      error: err.message || "Sunucu tarafında beklenmeyen bir hata oluştu."
    });
  }
}
