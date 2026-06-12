import { createClient } from '@supabase/supabase-js';

// KEY VE URL BİLGİLERİNİ BURAYA YAPIŞTIR
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {

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
      console.error("Supabase Hatası:", error);
      throw error;
    }

    const currentPersonality = data.personality_text;

    // 2. Senin API'ye güncel metin ile isteği atıyoruz
    const response = await fetch(
      "https://grokenforceplus.vercel.app/api/enforce-chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          user_name: username || "Müşteri",
          message: message,
          personality: currentPersonality
        })
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "API cevap vermedi"
      });
    }

    const apiData = await response.json();

    return res.status(200).json({
      reply: apiData.reply || "Cevap alınamadı"
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: "Sunucu hatası"
    });

  }
}
