// @ts-ignore -- @capacitor/cli is an optional dev dependency for native builds
import type { CapacitorConfig } from '@capacitor/cli'
const config: CapacitorConfig = {
  appId: 'app.platetrack',
  appName: 'PlateTrack',
  webDir: 'out',
  server: { androidScheme: 'https' },
  plugins: {
    PushNotifications: { presentationOptions: ['badge','sound','alert'] },
  },
}
export default config
