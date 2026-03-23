// Legacy route group — replaced by (app).
import { Redirect } from 'expo-router'
export default function TabsLayout() {
  return <Redirect href="/(app)" />
}
