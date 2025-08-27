import { Bug, Rocket, User2 } from 'lucide-react';

export function PolarionImpact() {
    const items = [
        { icon: Bug, title: 'Find Issues Earlier' },
        { icon: User2, title: 'Code Faster' },
        { icon: Rocket, title: 'Launch Faster and Safer' },
    ];

    return (
        <section className="py-24 md:py-32 lg:py-40 relative bg-[#0f0f0f] text-white">
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-16 text-center">
                    The Impact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            className="group relative text-center border-t-2 border-white pt-8 hover:transform hover:scale-105 transition-all duration-300"
                        >
                            <item.icon className="w-16 h-16 text-[#9B51E0] group-hover:text-white transition-colors duration-300 mx-auto mb-6" />
                            <p className="text-2xl md:text-3xl">{item.title}</p>
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
