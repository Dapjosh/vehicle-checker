
'use server';

import { type InspectionCategory, type UserData, type Organization, InspectionItemWithStatus, InspectionReport } from '@/lib/definitions';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { SUPER_ADMIN_UID, NEXT_PUBLIC_BASE_URL } from '@/lib/config';
import { getChecklist } from '@/lib/firestore';

// =================================================================================
// Helper Functions
// =================================================================================

/**
 * Converts a string into a URL-friendly "slug".
 * e.g., "New Company Inc." -> "new-company-inc"
 * @param text The string to convert.
 * @returns The slugified string.
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
}


// =================================================================================
// Inspection Report Actions
// =================================================================================

export async function saveInspectionReport(data: Record<string, any>, user: UserData, categories: InspectionCategory[]): Promise<{ success: boolean; message: string; }> {
    if (!user || !user.orgId) {
        return { success: false, message: "User is not authenticated or does not belong to an organization." };
    }

    try {
        const reportRef = adminDb.collection(`organizations/${user.orgId}/inspections`).doc();

        const inspectionItems: InspectionItemWithStatus[] = [];
        categories.forEach(category => {
            category.items.forEach(item => {
                inspectionItems.push({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    categoryId: category.id,
                    categoryName: category.name,
                    status: data[`${item.id}_status`] || 'not ok',
                    notes: data[`${item.id}_notes`] || '',
                });
            });
        });

        // Prepare the data with a server-side timestamp.
        const firestoreData = {
            vehicleRegistration: data.vehicleRegistration,
            driverName: data.driverName,
            finalVerdict: data.finalVerdict,
            items: inspectionItems,
            submittedBy: user.uid,
            submittedAt: FieldValue.serverTimestamp(),
        };

        await reportRef.set(firestoreData);

        return {
            success: true,
            message: "Inspection report saved successfully!",
        };

    } catch (error) {
        console.error("Error saving inspection report: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while saving the report.";
        return { success: false, message: errorMessage };
    }
}

export async function getAllReportsForExport(orgId: string): Promise<{ success: boolean; data?: InspectionReport[]; error?: string; }> {
    if (!orgId) {
        return { success: false, error: "Organization ID is required." };
    }
    try {
        const reportsRef = adminDb.collection(`organizations/${orgId}/inspections`);
        const q = reportsRef.orderBy('submittedAt', 'desc');
        const snapshot = await q.get();

        if (snapshot.empty) {
            return { success: true, data: [] };
        }

        const reports = snapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure timestamp is converted correctly for serialization
            if (data.submittedAt instanceof Timestamp) {
                data.submittedAt = {
                    seconds: data.submittedAt.seconds,
                    nanoseconds: data.submittedAt.nanoseconds,
                }
            }
            return { id: doc.id, ...data } as InspectionReport;
        });

        return { success: true, data: reports };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error fetching all reports for org ${orgId}:`, message);
        return { success: false, error: "Could not load reports for export." };
    }
}


// =================================================================================
// Checklist Actions
// =================================================================================
export async function getChecklistAction(orgId: string): Promise<{ success: boolean; data?: InspectionCategory[]; error?: string; }> {
    if (!orgId) {
        return { success: false, error: "Organization ID is required." };
    }
    try {
        const checklistData = await getChecklist(orgId);
        return { success: true, data: checklistData };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error fetching checklist for org ${orgId}:`, message);
        return { success: false, error: "Could not load the inspection checklist." };
    }
}

// =================================================================================
// User and Organization Management Actions
// =================================================================================

export async function verifyInvitationToken(token: string): Promise<{ success: boolean; email?: string; error?: string; }> {
    if (!token) {
        return { success: false, error: "Invitation token is missing." };
    }
    try {
        const tokenRef = adminDb.collection('invitations').doc(token);
        const tokenDoc = await tokenRef.get();

        if (!tokenDoc.exists || tokenDoc.data()?.claimed) {
            return { success: false, error: "This invitation is invalid or has already been claimed." };
        }

        return { success: true, email: tokenDoc.data()?.email };
    } catch (e) {
        console.error("Error verifying invitation token:", e);
        return { success: false, error: "There was a problem verifying your invitation." };
    }
}


export async function claimInvitationToken(token: string, uid: string, email: string): Promise<{ success: boolean; error?: string; }> {
    const batch = adminDb.batch();
    const invitationRef = adminDb.collection('invitations').doc(token);


    try {
        const invitationDoc = await invitationRef.get();

        if (!invitationDoc.exists) {
            return { success: false, error: "Invitation not found." };
        }

        const invitation = invitationDoc.data();
        if (!invitation || invitation.claimed) {
            return { success: false, error: "This invitation is invalid or has already been claimed." };
        }

        if (invitation.email.toLowerCase() !== email.toLowerCase()) {
            return { success: false, error: "This invitation is for a different email address." };
        }

        // 1. Create the organization since the user is accepting the invite
        const orgRef = adminDb.collection('organizations').doc(invitation.orgId);
        const orgData = {
            name: invitation.orgName,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: uid, // The user who claims the invite creates the org
        };
        batch.set(orgRef, orgData);

        // 2. Create the user document
        const userRef = adminDb.collection('users').doc(uid);
        const newUser: UserData = {
            uid,
            email: invitation.email,
            orgId: invitation.orgId,
            role: invitation.role,
        };
        batch.set(userRef, newUser);

        // 3. Mark the invitation as claimed
        batch.update(invitationRef, {
            claimed: true,
            claimedAt: FieldValue.serverTimestamp(),
            claimedBy: uid
        });

        await batch.commit();

        return { success: true };

    } catch (error) {
        console.error("Error claiming invitation:", error);
        return { success: false, error: "An unexpected server error occurred." };
    }
}


export async function createOrganizationAndInvite(orgName: string, userEmail: string, superAdminUid: string): Promise<{ success: boolean; message: string; signupLink?: string; }> {
    if (superAdminUid !== SUPER_ADMIN_UID) {
        return { success: false, message: 'Unauthorized action.' };
    }

    try {
        const orgId = slugify(orgName);
        if (!orgId) {
            return { success: false, message: "Organization name is invalid." };
        }

        const orgRef = adminDb.collection('organizations').doc(orgId);
        const existingOrg = await orgRef.get();
        if (existingOrg.exists) {
            return { success: false, message: "An organization with this name already exists." };
        }

        const usersRef = adminDb.collection('users');
        const q = usersRef.where("email", "==", userEmail);
        const existingUserSnapshot = await q.get();

        if (!existingUserSnapshot.empty) {
            return { success: false, message: "A user with this email already exists." };
        }

        // Create an invitation for the new user, but DO NOT create the org yet.
        const invitationToken = uuidv4();
        const invitationRef = adminDb.collection('invitations').doc(invitationToken);
        const invitationData = {
            email: userEmail,
            role: 'member',
            orgId: orgId,
            orgName: orgName,
            invitedBy: superAdminUid,
            createdAt: FieldValue.serverTimestamp(),
            claimed: false,
        };
        await invitationRef.set(invitationData);

        // Generate signup link and return it
        const signupLink = `${NEXT_PUBLIC_BASE_URL || ''}/signup?token=${invitationToken}`;

        return { success: true, message: `Invitation link generated for ${userEmail}.`, signupLink };

    } catch (error) {
        console.error("Error creating invitation:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function getAllOrganizations(): Promise<Organization[]> {
    const orgsRef = adminDb.collection('organizations');
    const q = orgsRef.orderBy('createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return {
            id: doc.id,
            name: data.name,
            createdAt: createdAt,
        } as Organization;
    });
}

