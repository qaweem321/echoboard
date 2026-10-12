"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gt, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@/config/site";
import { db } from "@/db";
import { invitations, memberships, users } from "@/db/schema";
import { getOrganizationPlan } from "@/lib/billing";
import { plans } from "@/lib/billing/plans";
import { isDemoMode } from "@/lib/demo";
import { buttonEmailHtml, sendEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/email-address";
import { changeRoleKeepingOwner, removeMembershipKeepingOwner } from "@/lib/owners";
import { isRole } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { requirePermission } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

const INVITE_DAYS = 7;

async function findMembership(membershipId: string, organizationId: string) {
  // IDs come from the browser: check the shape first for a clean error, not a database one.
  if (!isUuid(membershipId)) {
    throw new Error("Member not found.");
  }
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)));

  if (!membership) {
    throw new Error("Member not found.");
  }
  return membership;
}

export async function updateMemberRole(formData: FormData) {
  const slug = String(formData.get("slug"));
  const newRole = String(formData.get("role"));
  const { user, organization } = await requirePermission(slug, "member:update-role");

  if (!isRole(newRole)) {
    throw new Error("Invalid role.");
  }
  const target = await findMembership(String(formData.get("membershipId")), organization.id);
  if (target.userId === user.id) {
    throw new Error("You can't change your own role.");
  }

  if (!(await changeRoleKeepingOwner(organization.id, target.id, newRole, user.id))) {
    throw new Error("The workspace must keep at least one owner.");
  }
  revalidatePath(`/dashboard/${slug}/members`);
}

export async function removeMember(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { user, role, organization } = await requirePermission(slug, "member:remove");

  const target = await findMembership(String(formData.get("membershipId")), organization.id);
  if (target.userId === user.id) {
    throw new Error("You can't remove yourself.");
  }
  if (target.role === "owner" && role !== "owner") {
    throw new Error("Only owners can remove an owner.");
  }

  if (!(await removeMembershipKeepingOwner(organization.id, target.id, user.id))) {
    throw new Error("The workspace must keep at least one owner.");
  }
  revalidatePath(`/dashboard/${slug}/members`);
}

export type InviteState = {
  error?: string;
  success?: string;
  email?: string;
  // Demo mode sends no emails, so the inviter gets the link to share themselves.
  link?: string;
};

export async function inviteMember(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const slug = String(formData.get("slug"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role"));
  const { user, role: myRole, organization } = await requirePermission(slug, "member:invite");

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address.", email };
  }
  if (!isRole(role)) {
    return { error: "Please choose a valid role.", email };
  }
  if (role === "owner" && myRole !== "owner") {
    return { error: "Only owners can invite owners.", email };
  }

  // Independent checks, run together. Expired invitations don't take a seat.
  const [alreadyMember, planId, memberCount, otherInvites] = await Promise.all([
    db
      .select({ id: memberships.id })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(and(eq(memberships.organizationId, organization.id), eq(users.email, email))),
    getOrganizationPlan(organization.id),
    db.$count(memberships, eq(memberships.organizationId, organization.id)),
    db.$count(
      invitations,
      and(
        eq(invitations.organizationId, organization.id),
        ne(invitations.email, email),
        gt(invitations.expiresAt, new Date()),
      ),
    ),
  ]);
  if (alreadyMember.length > 0) {
    return { error: "That person is already a member.", email };
  }
  const plan = plans[planId];
  if (memberCount + otherInvites >= plan.memberLimit) {
    return {
      error: `The ${plan.name} plan allows up to ${plan.memberLimit} members (including pending invites). Upgrade to Pro for unlimited members.`,
      email,
    };
  }

  // Stop the app being used to send spam: at most 20 invitation emails per workspace and 30 per
  // person per hour (so creating more workspaces doesn't allow more).
  const [perOrganization, perUser] = await Promise.all([
    rateLimit(`invite:${organization.id}`, 20, 60 * 60),
    rateLimit(`invite-user:${user.id}`, 30, 60 * 60),
  ]);
  if (!perOrganization.allowed || !perUser.allowed) {
    return { error: "Too many invitations sent. Please try again in an hour.", email };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

  await db
    .insert(invitations)
    .values({
      organizationId: organization.id,
      email,
      role,
      token,
      invitedById: user.id,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [invitations.organizationId, invitations.email],
      set: { role, token, invitedById: user.id, expiresAt },
    });

  revalidatePath(`/dashboard/${slug}/members`);

  const link = absoluteUrl(`/invite/${token}`);
  if (isDemoMode()) {
    return {
      success: `Invitation created for ${email}. Emails are off in this demo, so open this link in another browser to accept it:`,
      link,
    };
  }
  try {
    await sendEmail({
      to: email,
      subject: `${user.name} invited you to join ${organization.name}`,
      text: `${user.name} invited you to join ${organization.name} as ${role}.\n\nAccept the invitation: ${link}\n\nThis link expires in ${INVITE_DAYS} days.`,
      html: buttonEmailHtml({
        heading: `Join ${organization.name}`,
        message: `${user.name} invited you to join ${organization.name} as ${role}.`,
        buttonText: "Accept invitation",
        url: link,
        footer: `This link expires in ${INVITE_DAYS} days.`,
      }),
    });
  } catch (error) {
    console.error(error);
    return { error: `Invitation saved, but the email to ${email} could not be sent.`, email };
  }

  return { success: `Invitation sent to ${email}.` };
}

export async function revokeInvitation(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "member:invite");
  const invitationId = formData.get("invitationId");
  if (!isUuid(invitationId)) {
    throw new Error("Invitation not found.");
  }

  await db
    .delete(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.organizationId, organization.id)));
  revalidatePath(`/dashboard/${slug}/members`);
}
