export default async function handler(req, res) {
  try {
    const url = process.env.VITE_SUPABASE_URL || 'https://jluasmjyjytkgnkhbefx.supabase.co';
    const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdWFzbWp5anl0a2dua2hiZWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzU2MjEsImV4cCI6MjA5Mjg1MTYyMX0.ekFiXByUb1IY6KfM_xPU6JUuOiR_ut6NRkVxj3BCMCo';

    const response = await fetch(`${url}/rest/v1/config?select=id`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });

    const data = await response.json();
    return res.status(200).json({
      success: true,
      message: 'Supabase keep-alive ping executed successfully',
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
