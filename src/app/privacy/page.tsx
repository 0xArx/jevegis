import { LegalPage } from "@/components/Legal";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 17, 2026"
      sections={[
        ["What we collect", "Your email address (to create an account and keys), a hash of each API key (never the key itself), and for each API request: the endpoint, the verdict, the per-check scores, latency, token counts, and a timestamp. For the unauthenticated playground and key-issuance forms, a salted hash of the requesting IP address, kept for rate limiting."],
        ["The text you send", "The text you submit for evaluation is sent to our inference provider, TypeSafe, to produce the judgment, and is not stored by Jevegis after the response is returned. We store the scores, not the content. Do not send content you are not permitted to share with a processor."],
        ["Sub-processors", "TypeSafe (model inference), Supabase (database and authentication), Vercel (hosting), and Resend (transactional email for sign-in links)."],
        ["How we use data", "To operate the Service, enforce rate limits, show you your own usage, secure the platform, and improve detection quality using aggregate, non-identifying statistics. We do not sell personal data and do not use your submitted text to train models."],
        ["Retention", "Request logs are kept for 90 days. Account and key records are kept until you delete your account. IP hashes for rate limiting are kept for 24 hours."],
        ["Your rights", "You can view and revoke your keys in the dashboard. To export or delete your account data, contact us from the email on your account and we will complete the request within 30 days."],
        ["Cookies", "We set only the cookies required to keep you signed in. No advertising or cross-site tracking cookies."],
        ["Changes", "We will update the date above when this policy changes and, for material changes, note it on the site."],
      ]}
    />
  );
}
