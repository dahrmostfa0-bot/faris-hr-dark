 import type { Metadata } from "next";
import LandingNavbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ValueSection from "@/components/landing/ValueSection";
import SolutionSection from "@/components/landing/SolutionSection";
import CostSection from "@/components/landing/CostSection";
import BeforeAfter from "@/components/landing/BeforeAfter";
import WhyFaris from "@/components/landing/WhyFaris";
import NoPressure from "@/components/landing/NoPressure";
import Footer from "@/components/landing/Footer";
import MobileCTA from "@/components/landing/MobileCTA";

export const metadata: Metadata = {
  title: "فارس دحروج الذكي | نظام إدارة الموارد البشرية للمدارس والشركات والمؤسسات",
  description:
    "نظام ذكي لإدارة الموظفين والحضور والإجازات والرواتب والعقود والملفات والتوظيف في منصة واحدة، مناسب للمدارس والشركات والمؤسسات.",
  keywords: [
    "إدارة الموارد البشرية",
    "نظام موارد بشرية",
    "إدارة الموظفين",
    "نظام HR",
    "إدارة المدارس",
    "حضور وانصراف",
    "رواتب",
    "فارس دحروج",
  ],
  openGraph: {
    title: "فارس دحروج الذكي | نظام إدارة الموارد البشرية",
    description:
      "كل ما تحتاجه لإدارة موظفيك... في نظام واحد. مناسب للمدارس والشركات والمؤسسات.",
    type: "website",
    locale: "ar_SA",
    siteName: "فارس دحروج الذكي",
  },
  twitter: {
    card: "summary_large_image",
    title: "فارس دحروج الذكي | نظام إدارة الموارد البشرية",
    description:
      "نظام ذكي لإدارة الموظفين والحضور والإجازات والرواتب والعقود في منصة واحدة.",
  },
};

export default function LandingPage() {
  return (
    <div dir="rtl" className="bg-white text-slate-900">
      <LandingNavbar />
      <main>
        <Hero />
        <ProblemSection />
        <DashboardPreview />
        <FeaturesSection />
        <HowItWorks />
        <ValueSection />
        <SolutionSection />
        <CostSection />
        <BeforeAfter />
        <WhyFaris />
        <NoPressure />
      </main>
      <Footer />
      <MobileCTA />
    </div>
  );
}
