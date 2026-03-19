import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import MobileTopBar from './MobileTopBar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-brand-secondary text-brand-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-12 pb-16 md:pt-0 md:pb-0">
        <Outlet />
      </main>
      <MobileTopBar />
      <MobileNav />
    </div>
  )
}
