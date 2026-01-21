"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  type InspectionCategory,
  InspectionReportSummary,
  type UserData,
  type Organization,
  type MemberData,
  type Vehicle,
  type Driver,
  InspectionItemWithStatus,
  InspectionReport,
} from "@/lib/definitions";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { SUPER_ADMIN_UID, NEXT_PUBLIC_BASE_URL } from "@/lib/config";
import { getChecklist } from "@/lib/firestore";
import { redirect } from "next/dist/server/api-utils";
import { sendLeadEmail } from "@/lib/email";

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
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

/**
 * Formats a driver's name into Title Case.
 * e.g., "jOhN dOE" -> "John Doe"
 * @param name The name to format.
 * @returns The formatted name.
 */
function formatDriverName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats a vehicle registration number to uppercase with no spaces or hyphens.
 * e.g., "abc-123 xy" -> "ABC123XY"
 * @param registration The registration to format.
 * @returns The formatted registration.
 */
function formatVehicleRegistration(registration: string): string {
  if (!registration) return "";
  return registration.replace(/[\s-]+/g, "").toUpperCase();
}

// =================================================================================
// Inspection Report Actions
// =================================================================================

export async function getReports(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  const { orgId } = await auth(); // Get orgId securely
  if (!orgId) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const reportsRef = adminDb.collection(`organizations/${orgId}/inspections`);
    const q = reportsRef.orderBy("submittedAt", "desc");
    const snapshot = await q.get();

    // return snapshot.docs.map((doc) => ({
    //     id: doc.id,
    //     ...doc.data(),
    // } as InspectionReportSummary));
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      const submittedAtTimestamp = data.submittedAt as Timestamp;

      const serializableSubmittedAt = {
        seconds: submittedAtTimestamp.seconds,
        nanoseconds: submittedAtTimestamp.nanoseconds,
      };

      // Create a plain object that matches your client-side type
      return {
        id: doc.id,
        ...data,
        submittedAt: serializableSubmittedAt,
      };
    });

    return { success: true, data: reports };
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return { success: false, error: error.message };
  }
}

export async function submitLeadAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const companyName = formData.get("companyName") as string;
  const fleetSize = formData.get("fleetSize") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !companyName) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    // 1. Save to Firestore 'leads' collection
    await adminDb.collection("leads").add({
      name,
      email,
      companyName,
      fleetSize,
      message,
      status: "new", // new, contacted, onboarded
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`New Lead Received: ${email} from ${companyName}`);

    const emailData = {
      name,
      email,
      companyName,
      fleetSize,
      message,
    };

    await sendLeadEmail(emailData);

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting lead:", error);
    return {
      success: false,
      error: "Failed to submit request. Please try again.",
    };
  }
}

export async function saveInspectionReport(
  data: Record<string, any>,
  categories: InspectionCategory[],
): Promise<{ success: boolean; message: string }> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      success: false,
      message:
        "User is not authenticated or does not belong to an organization.",
    };
  }

  try {
    const reportRef = adminDb
      .collection(`organizations/${orgId}/inspections`)
      .doc();

    const inspectionItems: any[] = [];
    categories.forEach((category) => {
      category.items.forEach((item) => {
        inspectionItems.push({
          id: item.id,
          name: item.name,
          description: item.description,
          categoryId: category.id,
          categoryName: category.name,
          status: data[`${item.id}_status`] || "not ok",
          notes: data[`${item.id}_notes`] || "",
        });
      });
    });

    const odometer = parseInt(data.currentOdometer, 10);

    //capitize string
    const inspectedBy = data.inspectingOfficer.toUpperCase();

    // Prepare the data with a server-side timestamp.
    const firestoreData = {
      vehicleRegistration: data.vehicleRegistration,
      currentOdometer: isNaN(odometer) ? null : odometer,
      driverName: data.driverName,
      finalVerdict: data.finalVerdict,
      inspectedBy: inspectedBy,
      items: inspectionItems,
      submittedBy: userId,
      submittedAt: FieldValue.serverTimestamp(),
    };

    await reportRef.set(firestoreData);

    revalidatePath("/reports");

    return {
      success: true,
      message: "Inspection report saved successfully!",
    };
  } catch (error) {
    console.error("Error saving inspection report: ", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while saving the report.";
    return { success: false, message: errorMessage };
  }
}

export async function getAllReportsForExport(): Promise<{
  success: boolean;
  data?: InspectionReport[];
  error?: string;
}> {
  const { orgId } = await auth(); // Get orgId securely
  if (!orgId) {
    return { success: false, error: "No organization found." };
  }
  try {
    const reportsRef = adminDb.collection(`organizations/${orgId}/inspections`);
    const q = reportsRef.orderBy("submittedAt", "desc");
    const snapshot = await q.get();

    if (snapshot.empty) {
      return { success: true, data: [] };
    }

    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Ensure timestamp is converted correctly for serialization
      if (data.submittedAt instanceof Timestamp) {
        data.submittedAt = {
          seconds: data.submittedAt.seconds,
          nanoseconds: data.submittedAt.nanoseconds,
        };
      }
      return { id: doc.id, ...data } as InspectionReport;
    });

    return { success: true, data: reports };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
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
    return { success: false, error: "User is not authenticated." };
  }

  try {
    const reportRef = adminDb
      .collection(`organizations/${orgId}/inspections`)
      .doc(reportId);

    const docSnap = await reportRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Report not found." };
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
export async function getChecklistAction(): Promise<{
  success: boolean;
  data?: InspectionCategory[];
  error?: string;
}> {
  const { orgId } = await auth();
  const user = await currentUser();

  const isSuperAdmin = user?.publicMetadata?.role === "super_admin";
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
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Error fetching checklist for org ${orgId}:`, message);
    return {
      success: false,
      error: "Could not load the inspection checklist.",
    };
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

export async function createOrganizationAndInvite(
  orgName: string,
  userEmail: string,
): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();

  const { userId } = await auth();

  if (!userId || !user) {
    return { success: false, message: "Unauthorized action." };
  }

  if (user?.publicMetadata?.role !== "super_admin") {
    return { success: false, message: "Unauthorized action." };
  }
  if (!orgName || !userEmail) {
    return {
      success: false,
      message: "Organization name and email are required.",
    };
  }

  try {
    const client = await clerkClient();
    const orgId = slugify(orgName);

    if (!orgId) {
      return { success: false, message: "Organization name is invalid." };
    }

    const orgQuery = await adminDb
      .collection("organizations")
      .where("slug", "==", orgId)
      .limit(1)
      .get();

    if (!orgQuery.empty) {
      return {
        success: false,
        message: `An organization named "${orgName}" already exists.`,
      };
    }

    const newClerkOrg = await client.organizations.createOrganization({
      name: orgName,
      slug: orgId,
    });

    const emailAddress = userEmail.toLowerCase();
    const organizationId = newClerkOrg.id;
    const role = "org:admin";
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/accept-invite`;
    const inviterUserId = userId;

    try {
      await client.organizations.createOrganizationMembership({
        organizationId: organizationId,
        userId: inviterUserId,
        role: "org:admin",
      });
    } catch (error) {
      console.error("Failed to add superadmin to organization:", error);
      throw new Error(
        "Could not initialize organization membership for admin.",
      );
    }

    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId,
      inviterUserId,
      emailAddress,
      role,
      redirectUrl,
    });

    const orgRef = adminDb.collection("organizations").doc(newClerkOrg.id).set({
      clerkOrgId: newClerkOrg.id,
      name: newClerkOrg.name,
      slug: newClerkOrg.slug,
      plan: "free",
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/super-admin/");
    return { success: true, message: "Organization created successfully." };
  } catch (error) {
    console.error("Error creating invitation:", error);
    if (error && typeof error === "object" && "errors" in error) {
      const errWithErrors = error as { errors?: unknown };
      console.error(
        "Clerk API specific errors:",
        JSON.stringify(errWithErrors.errors, null, 2),
      );
    }
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getOrgUsers(orgId: string): Promise<MemberData[]> {
  if (orgId === "SUPER_ORG") {
    return []; // Super admin org has no other members.
  }
  const membersRef = adminDb.collection(`organizations/${orgId}/members`);
  // const q = usersRef.where('orgId', '==', orgId);

  const snapshot = await membersRef.get();

  console.log(
    `[getOrgUsers] Found ${snapshot.size} member documents. for org ${orgId}`,
  );

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    if (data.createdAt && typeof data.createdAt.toMillis === "function") {
      data.createdAt = {
        seconds: data.createdAt.seconds,
        nanoseconds: data.createdAt.nanoseconds,
      };
    }

    return {
      id: doc.id,
      ...data,
    } as MemberData;
  });
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const user = await currentUser();
  const { userId } = await auth();

  if (!userId || user?.publicMetadata?.role !== "super_admin") {
    throw new Error("You are not authorized to perform this action.");
  }
  const orgsRef = adminDb.collection("organizations");
  const q = orgsRef.orderBy("createdAt", "desc");
  const snapshot = await q.get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
    return {
      id: data.clerkOrgId || doc.id,
      name: data.name,
      slug: data.slug,
      createdAt: createdAt,
    } as Organization;
  });
}

export async function inviteUserToOrg(orgId: string, email: string) {
  const { userId, orgRole, orgSlug } = await auth();

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const client = await clerkClient();

  try {
    const organization = await client.organizations.getOrganization({
      organizationId: orgId,
    });

    if (orgRole !== "org:admin") {
      return { success: false, error: "Unauthorized" };
    }
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/accept-invite`;

    // Create the invitation in Clerk
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress: email,
      role: "org:member",
      redirectUrl: redirectUrl,
    });

    const adminRef = adminDb.collection(`organizations/${orgId}/members`).doc();

    await adminRef.set({
      clerkOrgId: orgId,
      name: organization.name,
      slug: orgSlug,
      email: email,
      role: "org:member",
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to invite user:", error);
    // Return a friendly error message
    const errorMessage =
      error.errors?.[0]?.message ||
      error.message ||
      "Failed to send invitation";
    return { success: false, error: errorMessage };
  }
}

// =================================================================================
// Fleet Management Actions (Drivers & Vehicles)
// =================================================================================

async function getCollectionData<T>(
  orgId: string,
  collectionName: "drivers" | "vehicles",
  orderByField: keyof T & string,
): Promise<T[]> {
  if (!orgId) return [];

  const collectionRef = adminDb.collection(
    `organizations/${orgId}/${collectionName}`,
  );
  const q = collectionRef.orderBy(orderByField, "asc");
  const snapshot = await q.get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
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
  return getCollectionData<Driver>(orgId, "drivers", "name");
}

export async function getVehicles(): Promise<Vehicle[]> {
  const { orgId } = await auth(); // Get orgId securely
  if (!orgId) return [];
  return getCollectionData<Vehicle>(orgId, "vehicles", "registration");
}

async function addFleetItem(
  collectionName: "drivers" | "vehicles",
  data: { name: string } | { registration: string },
): Promise<{ success: boolean; message: string }> {
  const { orgId } = await auth(); // Get orgId securely
  if (!orgId) {
    return { success: false, message: "Organization ID is required." };
  }
  try {
    const itemRef = adminDb
      .collection(`organizations/${orgId}/${collectionName}`)
      .doc();
    await itemRef.set({
      ...data,
      id: itemRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {
      success: true,
      message: `${collectionName.slice(0, -1)} added successfully.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Error adding ${collectionName}:`, message);
    return {
      success: false,
      message: `Could not add ${collectionName.slice(0, -1)}.`,
    };
  }
}

export async function addDriver(
  name: string,
): Promise<{ success: boolean; message: string }> {
  const formattedName = formatDriverName(name);
  return addFleetItem("drivers", { name: formattedName });
}

export async function addVehicle(
  registration: string,
): Promise<{ success: boolean; message: string }> {
  const formattedRegistration = formatVehicleRegistration(registration);
  return addFleetItem("vehicles", { registration: formattedRegistration });
}

async function deleteFleetItem(
  collectionName: "drivers" | "vehicles",
  itemId: string,
): Promise<{ success: boolean; message: string }> {
  const { orgId } = await auth();
  if (!orgId || !itemId) {
    return {
      success: false,
      message: "Organization and item ID are required.",
    };
  }
  try {
    await adminDb
      .collection(`organizations/${orgId}/${collectionName}`)
      .doc(itemId)
      .delete();
    return {
      success: true,
      message: `${collectionName.slice(0, -1)} deleted successfully.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Error deleting ${collectionName}:`, message);
    return {
      success: false,
      message: `Could not delete ${collectionName.slice(0, -1)}.`,
    };
  }
}

export async function deleteDriver(
  driverId: string,
): Promise<{ success: boolean; message: string }> {
  if (!driverId) {
    return {
      success: false,
      message: "Organization and driver ID are required.",
    };
  }
  return deleteFleetItem("drivers", driverId);
}

export async function deleteVehicle(
  vehicleId: string,
): Promise<{ success: boolean; message: string }> {
  if (!vehicleId) {
    return {
      success: false,
      message: "Organization and vehicle ID are required.",
    };
  }
  return deleteFleetItem("vehicles", vehicleId);
}



//
// Payments
// ============================================================================================================================================================

export async function initializePaystackTransactionAction(email: string) {
    const { orgId } = await auth();

    if (!orgId) return { success: false, error: "No organization found" };

    const amountInKobo = 50 * 100; // NGN 50 charge for verification
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`;

    try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amountInKobo,
                callback_url: callbackUrl,
                metadata: {
                    orgId, // Pass orgId so we verify it later
                    type: 'card_verification'
                }
            }),
        });

        const data = await response.json();

        if (!data.status) {
            return { success: false, error: data.message };
        }

        return { success: true, url: data.data.authorization_url, reference: data.data.reference };
    } catch (error: any) {
        console.error("Paystack Init Error:", error);
        return { success: false, error: "Payment initialization failed" };
    }
}

/**
 * 2. Verify Transaction & Create Delayed Subscription
 * Called when Paystack redirects back to us.
 */
export async function verifyAndSubscribeAction(reference: string) {
    const { userId } = await auth();

    try {
        // A. Verify the Transaction
        const verifyReq = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });
        const verifyData = await verifyReq.json();

        if (!verifyData.status || verifyData.data.status !== 'success') {
            return { success: false, error: 'Transaction verification failed' };
        }

        const authCode = verifyData.data.authorization.authorization_code;
        const customerEmail = verifyData.data.customer.email;
        const orgId = verifyData.data.metadata.orgId;

        if (!authCode || !orgId) {
            return { success: false, error: 'Invalid transaction data' };
        }

        // B. Calculate Start Date (30 Days from now)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 30);

        // C. Create Subscription with Paystack
        const subReq = await fetch('https://api.paystack.co/subscription', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: customerEmail,
                plan: process.env.PAYSTACK_PLAN_CODE,
                authorization: authCode, // The tokenized card
                start_date: startDate.toISOString(), // Delay charge by 14 days
            }),
        });

        const subData = await subReq.json();

        if (!subData.status) {
            return { success: false, error: 'Failed to create subscription: ' + subData.message };
        }

        // D. Update Firestore
        const orgRef = adminDb.doc(`organizations/${orgId}`);

        await orgRef.update({
            plan: 'pro',
            subscriptionStatus: 'trialing',
            paystackSubCode: subData.data.subscription_code,
            paystackEmailToken: subData.data.email_token,
            trialEndsAt: startDate, // Save the actual date object/timestamp
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true };

    } catch (error: any) {
        console.error("Subscription Error:", error);
        return { success: false, error: error.message };
    }
}
