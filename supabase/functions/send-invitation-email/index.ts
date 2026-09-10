// Supabase Edge Function: send-invitation-email
// Deploy with: supabase functions deploy send-invitation-email
//
// Environment variables (server-side only - NEVER expose in frontend):
// - RESEND_API_KEY: Your Resend API key
// - REGISTRATION_URL: The URL of the student registration website
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for server-side operations)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REGISTRATION_URL = Deno.env.get("REGISTRATION_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers }
      );
    }

    // Create admin client to verify the caller
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication" }),
        { status: 401, headers }
      );
    }

    // 2. Verify caller is the teacher
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 403, headers }
      );
    }

    if (callerProfile.role !== "teacher") {
      return new Response(
        JSON.stringify({ error: "Only teachers can send invitations" }),
        { status: 403, headers }
      );
    }

    // 3. Parse and validate request body
    const { invitation_id, email, token: invitationToken } = await req.json();

    if (!invitation_id || !email || !invitationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: invitation_id, email, token" }),
        { status: 400, headers }
      );
    }

    // 4. Verify invitation exists and is valid
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .select("id, email, token, status, expires_at, created_by")
      .eq("id", invitation_id)
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        { status: 404, headers }
      );
    }

    // 5. Verify invitation belongs to the calling teacher
    if (invitation.created_by !== callerUser.id) {
      return new Response(
        JSON.stringify({ error: "Invitation does not belong to this teacher" }),
        { status: 403, headers }
      );
    }

    // 6. Verify invitation is still pending
    if (invitation.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Invitation is not pending (status: ${invitation.status})` }),
        { status: 400, headers }
      );
    }

    // 7. Verify invitation has not expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { status: 400, headers }
      );
    }

    // 8. Verify stored email matches destination email
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Email does not match invitation email" }),
        { status: 400, headers }
      );
    }

    // 9. Verify token matches
    if (invitation.token !== invitationToken) {
      return new Response(
        JSON.stringify({ error: "Token does not match invitation" }),
        { status: 400, headers }
      );
    }

    // 10. Verify email service is configured
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured (RESEND_API_KEY missing)" }),
        { status: 500, headers }
      );
    }

    // 11. Verify registration URL is configured
    if (!REGISTRATION_URL) {
      return new Response(
        JSON.stringify({ error: "Registration URL not configured (REGISTRATION_URL missing)" }),
        { status: 500, headers }
      );
    }

    const registrationLink = `${REGISTRATION_URL}/register?token=${invitationToken}`;

    // 12. Send email via Resend
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
                This invitation link will expire on <strong>${expiresAt.toLocaleDateString()}</strong>.
                Please register using this exact email address: <strong>${email}</strong>
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
        { status: 500, headers }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, email_id: data.id }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
