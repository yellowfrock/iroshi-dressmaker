export default function SareeCollectionLoading() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-[#e5e5e5] font-sans pb-24 overflow-x-hidden">
      {/* Hero skeleton */}
      <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-8 border-b border-white/10 text-center animate-pulse">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-48 h-6 rounded-full bg-white/10 mb-4" />
          <div className="w-80 sm:w-96 h-12 rounded-2xl bg-white/10 mb-4" />
          <div className="w-full max-w-xl h-4 rounded-lg bg-white/5 mb-2" />
          <div className="w-3/4 max-w-md h-4 rounded-lg bg-white/5 mb-8" />
          <div className="w-64 h-8 rounded-full bg-white/5" />
        </div>
      </section>

      {/* Grid skeleton */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 sm:pt-14">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="w-32 h-4 rounded bg-white/10" />
          <div className="w-36 h-4 rounded bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="rounded-2xl sm:rounded-3xl bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-xl animate-pulse"
            >
              <div className="aspect-[3/4] w-full bg-white/5" />
              <div className="p-5 space-y-3">
                <div className="w-20 h-3 rounded bg-[#F4D389]/20" />
                <div className="w-3/4 h-5 rounded bg-white/10" />
                <div className="w-full h-3.5 rounded bg-white/5" />
                <div className="w-2/3 h-3.5 rounded bg-white/5" />
                <div className="pt-3 border-t border-white/10">
                  <div className="w-full h-10 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
