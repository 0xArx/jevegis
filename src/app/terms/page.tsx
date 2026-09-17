import { LegalPage } from "@/components/Legal";

export const metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 17, 2026"
      sections={[
        ["The service", "Jevegis provides an API that evaluates text you send it and returns risk signals (\"the Service\"). By creating an API key or signing in, you agree to these terms."],
        ["Your account and keys", "You are responsible for keeping API keys secret and for all requests made with them. Revoke a key immediately in the dashboard if you believe it is compromised. Do not share one key across unrelated products or customers."],
        ["Acceptable use", "You may not use the Service to harass, surveil, or discriminate against individuals; to build a competing service by systematically extracting outputs; or in violation of applicable law. You may not send the Service content you do not have the right to process."],
        ["What the Service is and is not", "The Service returns probabilistic judgments. It is a signal for your own systems, not a decision-maker of record, and not a substitute for your own authentication, authorization, input validation, human review, or legal reporting obligations (including those concerning child safety). You remain responsible for decisions taken in your product."],
        ["Availability and changes", "The Service is provided as-is, without warranty of uptime or accuracy. We may change detection categories, thresholds, pricing, and rate limits, and will version breaking API changes where practical. Free tier limits may change with notice on the site."],
        ["Fees", "The free tier is free. Paid plans, when offered, are billed on usage as published on the pricing page. Fees are non-refundable except where required by law."],
        ["Liability", "To the maximum extent permitted by law, our total liability for any claim relating to the Service is limited to the amount you paid us in the three months before the claim. We are not liable for indirect, incidental, or consequential damages, including harm caused by content the Service failed to flag or flagged incorrectly."],
        ["Termination", "You may stop using the Service at any time. We may suspend or revoke keys that violate these terms or threaten the integrity of the Service, and will try to notify you at the email on the account."],
        ["Contact", "Questions about these terms: reply to any email from us, or use the email on your account to reach the operator."],
      ]}
    />
  );
}
