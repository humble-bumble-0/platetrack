export default function PrivacyPage() {
  return (
    <div className="px-6 pt-12 pb-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-[var(--text)] mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--subtext)] mb-6">Last updated: January 2025</p>
      {[
        ['Information we collect', 'We collect information you provide (name, email, fitness data) and usage data. We do not sell your personal information.'],
        ['How we use your data', 'To provide the PlateTrack service, personalise your experience, send notifications you request, and improve the app.'],
        ['Data storage', 'Your data is stored securely with Supabase (PostgreSQL) with row-level security. All data is encrypted at rest and in transit.'],
        ['Third-party services', 'We use Stripe and RevenueCat for payments, PostHog for analytics, Google AdMob for ads (free tier), Vercel for hosting.'],
        ['Your rights (GDPR/PIPEDA/CCPA)', 'You may request access to, correction of, or deletion of your data at any time via Settings → Delete Account or by emailing privacy@platetrack.app.'],
        ['Data retention', 'Active account data is retained while your account exists. Deleted account data is permanently removed within 30 days of deletion request.'],
        ['Contact', 'Questions? Email privacy@platetrack.app'],
      ].map(([h,p])=>(
        <div key={h as string} className="mb-6">
          <h2 className="font-bold text-[var(--text)] mb-1">{h}</h2>
          <p className="text-sm text-[var(--subtext)] leading-relaxed">{p}</p>
        </div>
      ))}
    </div>
  )
}
