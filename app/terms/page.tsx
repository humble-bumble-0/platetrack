export default function TermsPage() {
  return (
    <div className="px-6 pt-12 pb-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-[var(--text)] mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--subtext)] mb-6">Last updated: January 2025</p>
      {[
        ['Health disclaimer', 'PlateTrack is a fitness tracking tool, not medical advice. Consult a healthcare professional before starting any fitness program. Use at your own risk.'],
        ['Account', 'You are responsible for maintaining the security of your account. You must be 13+ years old to use PlateTrack.'],
        ['Subscriptions', 'Subscriptions renew automatically. Cancel anytime via your App Store/Google Play account settings or via the app. No refunds for partial periods except as required by law.'],
        ['In-app purchases', 'All purchases are final. If you experience a billing issue, contact support@platetrack.app within 30 days.'],
        ['Acceptable use', 'Do not use PlateTrack for anything illegal. Do not attempt to reverse engineer or exploit the service.'],
        ['Service availability', 'We strive for 99.9% uptime but make no guarantees. We may modify or discontinue features with reasonable notice.'],
        ['Contact', 'Questions? Email support@platetrack.app'],
      ].map(([h,p])=>(
        <div key={h as string} className="mb-6">
          <h2 className="font-bold text-[var(--text)] mb-1">{h}</h2>
          <p className="text-sm text-[var(--subtext)] leading-relaxed">{p}</p>
        </div>
      ))}
    </div>
  )
}
