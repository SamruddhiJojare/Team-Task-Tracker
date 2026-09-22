export function AuthArtwork() {
  return (
    <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/30 blur-2xl" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-mint/20 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white font-black text-ink">TT</span>
        <span className="text-lg font-bold">Teamtrack</span>
      </div>
      <div className="relative max-w-xl">
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-mint">One shared picture</p>
        <h1 className="text-5xl font-black leading-[1.08] tracking-tight">Clarity for every task, every teammate, every update.</h1>
        <div className="mt-10 grid grid-cols-3 gap-3">
          {["Role-aware", "Live timeline", "Focused work"].map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="text-xs text-white/50">0{index + 1}</span>
              <p className="mt-3 text-sm font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="relative text-sm text-white/50">Built for teams that prefer momentum over meetings.</p>
    </section>
  );
}
