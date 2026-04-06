/** @type {import('next').NextConfig} */
const config = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: { remotePatterns: [{ protocol:'https', hostname:'*.supabase.co' },{ protocol:'https', hostname:'*.googleusercontent.com' }] },
  async headers() {
    return [{ source:'/(.*)', headers:[
      {key:'X-Frame-Options',value:'DENY'},{key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    ]}]
  }
}
export default config

