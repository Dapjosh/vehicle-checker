"use server";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrganizationInviteEmail(to: string, orgName: string, signupLink: string): Promise<{ success: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not set. Cannot send email.");
        return { success: false, error: "Email service is not configured. RESEND_API_KEY is missing." };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Fleetcheckr <onboarding@fleetcheckr.com>', // Use Resend's sandbox domain for testing
            to: [to],
            subject: `You're invited to join ${orgName} on Fleetcheckr`,
            html: `
                <h1>You're Invited!</h1>
                <p>You have been invited to join the organization <strong>${orgName}</strong> on Fleetcheckr.</p>
                <p>Click the link below to create your account and get started:</p>
                <a href="${signupLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                    Accept Invitation
                </a>
                <p>If you did not expect this invitation, you can safely ignore this email.</p>
            `,
        });

        if (error) {
            console.error("Resend API error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error) {
        console.error("Failed to send email:", error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: message };
    }
}
