'use server';
import { auth } from '@clerk/nextjs/server';
import { getChecklist, setChecklist } from '@/lib/firestore';
import type { InspectionCategory } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

export async function getChecklistAction(): Promise<InspectionCategory[]> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Organization ID not found in user session.');
  }

  const checklist = await getChecklist(orgId);

  return checklist;
}

export async function saveChecklistAction(categories: InspectionCategory[]) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Not authenticated or no active organization.');
  }

  try {
    // 'setChecklist' is safe to call.
    await setChecklist(orgId, categories);
    // Revalidate the path to ensure data is fresh elsewhere
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
