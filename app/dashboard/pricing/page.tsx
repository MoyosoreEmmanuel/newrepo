import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FaCloud,
  FaHome,
  FaUser,
  FaCog,
  FaHistory,
  FaTags,
  FaMoon,
} from "react-icons/fa";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PricingSection from "./components/PricingSection";

export default function Home() {
  return (
    <>
      <PricingSection />
    </>
  );
}
