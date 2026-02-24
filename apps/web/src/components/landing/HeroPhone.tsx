export function HeroPhone() {
  return (
    <div className="relative w-[180px] min-[480px]:w-[200px] md:w-[220px] mx-auto">
      <div className="relative">
        <div className="relative bg-[#1c1c1e] rounded-[36px] min-[480px]:rounded-[40px] md:rounded-[44px] p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_0_1px_rgba(0,0,0,0.12),0_20px_60px_-10px_rgba(0,0,0,0.18)]">
          <div className="absolute bg-[#2a2a2e] rounded-sm z-10 -left-0.5 top-[75px] w-[3px] h-[22px]" />
          <div className="absolute bg-[#2a2a2e] rounded-sm z-10 -left-0.5 top-[110px] w-[3px] h-9" />
          <div className="absolute bg-[#2a2a2e] rounded-sm z-10 -left-0.5 top-[155px] w-[3px] h-9" />
          <div className="absolute bg-[#2a2a2e] rounded-sm z-10 -right-0.5 top-[125px] w-[3px] h-[50px]" />

          <div className="relative rounded-[33px] min-[480px]:rounded-[37px] md:rounded-[41px] overflow-hidden aspect-[1080/2048] bg-[#c8ddf0]">
            <img
              src="/phone-screenshot.jpg"
              alt="mrblu app — tap to record voice and create invoices"
              className="absolute inset-0 w-full h-full object-fill block select-none"
              loading="eager"
              draggable={false}
            />
          </div>
        </div>

        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[70%] h-[30px] bg-black/[0.06] blur-[30px] -z-10 rounded-full" />
      </div>
    </div>
  );
}
