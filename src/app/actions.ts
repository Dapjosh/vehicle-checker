
'use server';

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { type InspectionCategory, InspectionReportSummary, type UserData, type Organization, type Vehicle, type Driver, InspectionItemWithStatus, InspectionReport } from '@/lib/definitions';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { SUPER_ADMIN_UID, NEXT_PUBLIC_BASE_URL } from '@/lib/config';
import { getChecklist } from '@/lib/firestore';
import { redirect } from "next/dist/server/api-utils";



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

/**
 * Formats a driver's name into Title Case.
 * e.g., "jOhN dOE" -> "John Doe"
 * @param name The name to format.
 * @returns The formatted name.
 */
function formatDriverName(name: string): string {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Formats a vehicle registration number to uppercase with no spaces or hyphens.
 * e.g., "abc-123 xy" -> "ABC123XY"
 * @param registration The registration to format.
 * @returns The formatted registration.
 */
function formatVehicleRegistration(registration: string): string {
    if (!registration) return '';
    return registration.replace(/[\s-]+/g, '').toUpperCase();
}


// =================================================================================
// Inspection Report Actions
// =================================================================================

export async function getReports(): Promise<InspectionReportSummary[]> {
    const { orgId } = await auth(); // Get orgId securely
    if (!orgId) {
        return [];
    }

    try {
        const reportsRef = adminDb.collection(`organizations/${orgId}/inspections`);
        const q = reportsRef.orderBy('submittedAt', 'desc');
        const snapshot = await q.get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as InspectionReportSummary));
    } catch (error) {
        console.error("Error fetching reports:", error);
        return [];
    }
}



export async function saveInspectionReport(data: Record<string, any>, categories: InspectionCategory[]): Promise<{ success: boolean; message: string; }> {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
        return { success: false, message: "User is not authenticated or does not belong to an organization." };
    }

    if (!userId || !orgId) {
        return { success: false, message: "User is not authenticated or does not belong to an organization." };
    }

    try {
        const reportRef = adminDb.collection(`organizations/${orgId}/inspections`).doc();

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
            currentOdometer: data.currentOdometer,
            driverName: data.driverName,
            finalVerdict: data.finalVerdict,
            items: inspectionItems,
            submittedBy: userId,
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

export async function getAllReportsForExport(): Promise<{ success: boolean; data?: InspectionReport[]; error?: string; }> {
    const { orgId } = await auth(); // Get orgId securely
    if (!orgId) {
        return { success: false, error: "No organization found." };
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

export async function getReportDetails(reportId: string): Promise<{
    success: boolean;
    data?: InspectionReport;
    error?: string;
}> {
    const { orgId } = await auth(); // Gets orgId securely
    if (!orgId) {
        return { success: false, error: 'User is not authenticated.' };
    }

    try {
        const reportRef = adminDb
            .collection(`organizations/${orgId}/inspections`)
            .doc(reportId);

        const docSnap = await reportRef.get();

        if (!docSnap.exists) {
            return { success: false, error: 'Report not found.' };
        }

        const report = { id: docSnap.id, ...docSnap.data() } as InspectionReport;
        return { success: true, data: report };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// =================================================================================
// Checklist Actions
// =================================================================================
export async function getChecklistAction(): Promise<{ success: boolean; data?: InspectionCategory[]; error?: string; }> {
    const { orgId } = await auth();
    const user = await currentUser();

    const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';
    if (!orgId) {
        return { success: false, error: "No organization active." };
    }
    if (!orgId) {
        return { success: false, error: "Organization ID is required." };
    }
    try {
        const checklistData = await getChecklist(orgId, isSuperAdmin);
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

// export async function verifyInvitationToken(token: string): Promise<{ success: boolean; email?: string; error?: string; }> {
//     if (!token) {
//         return { success: false, error: "Invitation token is missing." };
//     }
//     try {
//         const tokenRef = adminDb.collection('invitations').doc(token);
//         const tokenDoc = await tokenRef.get();

//         if (!tokenDoc.exists() || tokenDoc.data()?.claimed) {
//             return { success: false, error: "This invitation is invalid or has already been claimed." };
//         }

//         return { success: true, email: tokenDoc.data()?.email };
//     } catch (e) {
//         console.error("Error verifying invitation token:", e);
//         return { success: false, error: "There was a problem verifying your invitation." };
//     }
// }


// export async function claimInvitationToken(token: string, uid: string, email: string): Promise<{ success: boolean; error?: string; }> {
//     const batch = adminDb.batch();
//     const invitationRef = adminDb.collection('invitations').doc(token);


//     try {
//         const invitationDoc = await invitationRef.get();

//         if (!invitationDoc.exists) {
//             return { success: false, error: "Invitation not found." };
//         }

//         const invitation = invitationDoc.data();
//         if (!invitation || invitation.claimed) {
//             return { success: false, error: "This invitation is invalid or has already been claimed." };
//         }

//         if (invitation.email.toLowerCase() !== email.toLowerCase()) {
//             return { success: false, error: "This invitation is for a different email address." };
//         }

//         // 1. Create the organization since the user is accepting the invite
//         const orgRef = adminDb.collection('organizations').doc(invitation.orgId);
//         const orgData = {
//             name: invitation.orgName,
//             createdAt: FieldValue.serverTimestamp(),
//             createdBy: uid, // The user who claims the invite creates the org
//         };
//         batch.set(orgRef, orgData);

//         // 2. Create the user document
//         const userRef = adminDb.collection('users').doc(uid);
//         const newUser: UserData = {
//             uid,
//             email: invitation.email,
//             orgId: invitation.orgId,
//             role: invitation.role,
//         };
//         batch.set(userRef, newUser);

//         // 3. Mark the invitation as claimed
//         batch.update(invitationRef, {
//             claimed: true,
//             claimedAt: FieldValue.serverTimestamp(),
//             claimedBy: uid
//         });

//         await batch.commit();

//         return { success: true };

//     } catch (error) {
//         console.error("Error claiming invitation:", error);
//         return { success: false, error: "An unexpected server error occurred." };
//     }
// }


export async function createOrganizationAndInvite(orgName: string, userEmail: string): Promise<{ success: boolean; message: string; }> {

    const user = await currentUser();


    const { userId } = await auth();

    if (!userId || !user) {
        return { success: false, message: 'Unauthorized action.' };
    }

    if (user?.publicMetadata?.role !== 'super_admin') {
        return { success: false, message: 'Unauthorized action.' };
    }
    if (!orgName || !userEmail) {
        return { success: false, message: "Organization name and email are required." };
    }

    try {
        const client = await clerkClient();
        const orgId = slugify(orgName);

        if (!orgId) {
            return { success: false, message: "Organization name is invalid." };
        }

        const orgQuery = await adminDb.collection("organizations").where("slug", "==", orgId).limit(1).get();

        if (!orgQuery.empty) {
            return {
                success: false,
                message: `An organization named "${orgName}" already exists.`
            };
        }


        const newClerkOrg = await client.organizations.createOrganization({
            name: orgName,
            slug: orgId,
        });



        const emailAddress = userEmail.toLowerCase();
        const organizationId = newClerkOrg.id;
        const role = 'org:admin';
        const redirectUrl = process.env.NEXT_PUBLIC_CLERK_REDIRECT_URL;
        const inviterUserId = userId;

        try {
            await client.organizations.createOrganizationMembership({
                organizationId: organizationId,
                userId: inviterUserId,
                role: 'org:admin',
            });
        } catch (error) {
            console.error("Failed to add superadmin to organization:", error);
            throw new Error("Could not initialize organization membership for admin.");
        }

        const invitation = await client.organizations.createOrganizationInvitation({
            organizationId,
            inviterUserId,
            emailAddress,
            role,
        });


        const orgRef = adminDb.collection('organizations').doc(newClerkOrg.id).set({
            clerkOrgId: newClerkOrg.id,
            name: newClerkOrg.name,
            slug: newClerkOrg.slug,
            plan: 'free',
            createdBy: userId,
            createdAt: FieldValue.serverTimestamp(),
        });

        revalidatePath("/super-admin/");
        return { success: true, message: "Organization created successfully." };


    } catch (error) {
        console.error("Error creating invitation:", error);
        if (error && typeof error === 'object' && 'errors' in error) {
            const errWithErrors = error as { errors?: unknown };
            console.error('Clerk API specific errors:', JSON.stringify(errWithErrors.errors, null, 2));
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function getAllOrganizations(): Promise<Organization[]> {

    const user = await currentUser();
    const { userId } = await auth();

    if (!userId || user?.publicMetadata?.role !== 'super_admin') {

        throw new Error("You are not authorized to perform this action.");
    }
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
            id: data.clerkOrgId || doc.id,
            name: data.name,
            slug: data.slug,
            createdAt: createdAt,
        } as Organization;
    });
}

// =================================================================================
// Fleet Management Actions (Drivers & Vehicles)
// =================================================================================

async function getCollectionData<T>(orgId: string, collectionName: 'drivers' | 'vehicles', orderByField: keyof T & string): Promise<T[]> {
    if (!orgId) return [];

    const collectionRef = adminDb.collection(`organizations/${orgId}/${collectionName}`);
    const q = collectionRef.orderBy(orderByField, 'asc');
    const snapshot = await q.get();

    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return {
            id: doc.id,
            ...data,
            createdAt,
        } as T;
    });
}

export async function getDrivers(): Promise<Driver[]> {
    const { orgId } = await auth(); // Get orgId securely
    if (!orgId) return [];
    return getCollectionData<Driver>(orgId, 'drivers', 'name');
}

export async function getVehicles(): Promise<Vehicle[]> {
    const { orgId } = await auth(); // Get orgId securely
    if (!orgId) return [];
    return getCollectionData<Vehicle>(orgId, 'vehicles', 'registration');
}

async function addFleetItem(collectionName: 'drivers' | 'vehicles', data: { name: string } | { registration: string }): Promise<{ success: boolean; message: string; }> {
    const { orgId } = await auth(); // Get orgId securely
    if (!orgId) {
        return { success: false, message: "Organization ID is required." };
    }
    try {
        const itemRef = adminDb.collection(`organizations/${orgId}/${collectionName}`).doc();
        await itemRef.set({
            ...data,
            id: itemRef.id,
            createdAt: FieldValue.serverTimestamp(),
        });
        return { success: true, message: `${collectionName.slice(0, -1)} added successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error adding ${collectionName}:`, message);
        return { success: false, message: `Could not add ${collectionName.slice(0, -1)}.` };
    }
}

export async function addDriver(name: string): Promise<{ success: boolean; message: string; }> {
    const formattedName = formatDriverName(name);
    return addFleetItem('drivers', { name: formattedName });
}

export async function addVehicle(registration: string): Promise<{ success: boolean; message: string; }> {
    const formattedRegistration = formatVehicleRegistration(registration);
    return addFleetItem('vehicles', { registration: formattedRegistration });
}


async function deleteFleetItem(collectionName: 'drivers' | 'vehicles', itemId: string): Promise<{ success: boolean; message: string; }> {
    const { orgId } = await auth();
    if (!orgId || !itemId) {
        return { success: false, message: "Organization and item ID are required." };
    }
    try {
        await adminDb.collection(`organizations/${orgId}/${collectionName}`).doc(itemId).delete();
        return { success: true, message: `${collectionName.slice(0, -1)} deleted successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error deleting ${collectionName}:`, message);
        return { success: false, message: `Could not delete ${collectionName.slice(0, -1)}.` };
    }
}

export async function deleteDriver(driverId: string): Promise<{ success: boolean; message: string; }> {
    if (!driverId) {
        return { success: false, message: "Organization and driver ID are required." };
    }
    return deleteFleetItem('drivers', driverId);
}

export async function deleteVehicle(vehicleId: string): Promise<{ success: boolean; message: string; }> {

    if (!vehicleId) {
        return { success: false, message: "Organization and vehicle ID are required." };
    }
    return deleteFleetItem('vehicles', vehicleId);
}


