import type { Metadata } from 'next';

import { FAQWrapper } from '@/components/custom/LandingPage/faq-wrapper';
import { GridBackground } from '@/components/custom/LandingPage/grid-background';
import { Industries } from '@/components/custom/LandingPage/industries';
import { IndustriesWeServe } from '@/components/custom/LandingPage/industries-we-serve';
import { Navbar } from '@/components/custom/LandingPage/navbar';
import { PolarionContact } from '@/components/custom/Polarion/contact';
import { PolarionDemo } from '@/components/custom/Polarion/demo';
import { PolarionHero } from '@/components/custom/Polarion/hero';
import { PolarionImpact } from '@/components/custom/Polarion/impact';
import { PolarionVideoComparison } from '@/components/custom/Polarion/video-comparison';
import { PolarionWhyGroundbreaking } from '@/components/custom/Polarion/why-groundbreaking';
import { LenisProvider } from '@/components/providers/lenis-provider';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export const metadata: Metadata = {
    title: 'Polarion Integration - ATOMS',
    description:
        'POLARION, MEET CLAUDE-LEVEL AI. Chat with every work item, trace, test-even code.',
};

export default function Home() {
    return (
        <LenisProvider>
            <div className="min-h-screen bg-[#0f0f0f] text-[#B5B5B5] relative">
                <GridBackground />
                <div className="relative z-10">
                    <Navbar />
                    <main>
                        <PolarionHero />
                        <div className="section-divider">
                            <PolarionDemo />
                        </div>
                        <div className="section-divider">
                            <IndustriesWeServe />
                        </div>
                        <div className="section-divider">
                            <PolarionWhyGroundbreaking />
                        </div>
                        <div className="section-divider">
                            <PolarionVideoComparison />
                        </div>
                        <div className="section-divider">
                            <Industries />
                        </div>
                        <div className="section-divider">
                            <PolarionImpact />
                        </div>
                        <div className="section-divider">
                            <FAQWrapper />
                        </div>
                        <div className="section-divider">
                            <PolarionContact />
                        </div>
                    </main>
                </div>
                <ScrollToTop />
            </div>
        </LenisProvider>
    );
}
