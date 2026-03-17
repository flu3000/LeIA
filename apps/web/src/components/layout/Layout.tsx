import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="flex h-screen bg-brand-secondary text-brand-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
