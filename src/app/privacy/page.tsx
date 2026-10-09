import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

const { name, companyName, supportEmail } = siteConfig;

// Describes what Echoboard actually stores. Update it when you add features.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="October 8, 2026">
      <p>
        This policy explains what personal data {companyName} collects when you use {name}, and why.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and a securely hashed password.</li>
        <li>Workspace details: names, members, roles and pending invitations.</li>
        <li>
          Feedback you share on a public portal: your ideas, votes and comments, and the name and
          email address you choose to add (both optional). The email is only used to tell you when
          ideas you voted for change status (for example when they ship). Every such email has an
          unsubscribe link.
        </li>
        <li>
          Session details: your IP address and browser type, to keep you logged in and protect your
          account.
        </li>
        <li>
          Billing details: your subscription status. Card details are handled by our payment
          provider and never reach our servers.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        Only to run the service: logging you in, sending account emails (verification, password
        reset, invitations), billing, and preventing abuse. We don&apos;t sell your data or use it
        for advertising.
      </p>

      <h2>Cookies</h2>
      <p>
        We use one essential cookie to keep you logged in, and on public portals one essential
        cookie that remembers your votes without an account (it holds a random code, not your
        identity). Your light or dark theme choice is saved in your browser. We don&apos;t use
        tracking or advertising cookies.
      </p>

      <h2>Who we share it with</h2>
      <p>Trusted providers that help us run the service, only as needed:</p>
      <ul>
        <li>Hosting and database (for example Vercel and Neon)</li>
        <li>Email delivery (Resend)</li>
        <li>Payments (Polar or Stripe)</li>
      </ul>
      <p>
        A workspace can also connect its own tools (for example Slack) with webhooks; feedback
        posted on that workspace&apos;s portal is then sent to those tools.
      </p>

      <h2>How long we keep it</h2>
      <p>
        As long as your account exists. You can delete your account from the Account page; your
        personal data is then removed, except what we must keep by law (for example invoices).
      </p>

      <h2>Your rights</h2>
      <p>
        You can view and update your details on the Account page, and ask for a copy or deletion of
        your data at any time.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests? Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
    </LegalPage>
  );
}
