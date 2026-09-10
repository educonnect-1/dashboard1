// Supabase Edge Function: send-invitation-email
// Deploy with: supabase functions deploy send-invitation-email
// 
// Environment variables (server-side only):
// - RESEND_API_KEY: Your Resend API key
// - REGISTRATION_URL: The URL of the student registration website

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REGISTRATION_URL = Deno.env.get("REGISTRATION_URL") || "https://register.example.com";

serve(async (req) => {
  try {
    const { invitation_id, email, token } = await req.json();

    if (!invitation_id || !email || !token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const registrationLink = `${REGISTRATION_URL}/register?token=${token}`;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "الأستاذ مروان الجنيدي <noreply@teacher-platform.com>",
        to: [email],
        subject: "You've been invited to join the class!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1d4ed8; margin-bottom: 5px;">You're Invited!</h1>
              <p style="color: #6b7280;">الأستاذ مروان الجنيدي - Teacher Dashboard</p>
            </div>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                You have been invited to join the educational platform. 
                Click the button below to complete your registration.
              </p>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="${registrationLink}" 
                   style="background: #2563eb; color: white; padding: 12px 32px; 
                          border-radius: 8px; text-decoration: none; font-weight: bold;
                          display: inline-block;">
                  Complete Registration
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                This invitation link will expire in 7 days. Please register using 
                this exact email address: <strong>${email}</strong>
              </p>
            </div>
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>If you did not expect this invitation, you can safely ignore this email.</p>
              <p>© الأستاذ مروان الجنيدي - Educational Platform</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, email_id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
