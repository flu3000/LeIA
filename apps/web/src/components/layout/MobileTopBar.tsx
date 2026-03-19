export default function MobileTopBar() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-primary border-b border-white/10 flex items-center gap-2.5 px-4 h-12">
      <svg
        viewBox="0 0 24 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-brand-accent shrink-0"
      >
        <path d="M11.5173 16.7831L21.5173 11.1829" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M12.3173 8.05552L15.2208 7.30087" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 10.9537L12.5526 7.20595" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M21.5173 20.483V11.483" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 26.483L11.5173 16.483" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 26.483L21.5173 20.8828" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 16.7831L1.51729 11.1829" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M10.7173 8.05552L7.81374 7.30087" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 10.9537L10.482 7.20595" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M1.51728 20.483L1.51728 11.483" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 26.483L1.51729 20.8828" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 7.08325L21.5173 1.48302" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5173 7.08325L1.51729 1.48302" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M21.4875 11.0344L18.5461 3.1956" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M1.54708 11.0344L4.48845 3.1956" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <span className="font-serif font-semibold text-lg text-brand-text leading-none">LeIA</span>
    </header>
  )
}
