import Image from "next/image";

export function Navigation() {
  return (
    <nav className="w-full flex items-center justify-between gap-8 py-6 mb-10">
      <section className="w-full flex items-center gap-3">
        <Image
          src={"/moonpay.png"}
          alt="moonpay.logo"
          width={30}
          height={30}
          loading="eager"
        />
        <h3 className="text-[1.2rem]">MoonPay</h3>
      </section>
    </nav>
  );
}
