"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaFile, FaHistory, FaDollarSign, FaBars } from "react-icons/fa";
import { House, Apple, Brain, BarChart2 } from "lucide-react";

const Navbar = () => {
  const currentPath = usePathname();
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(
    undefined
  );

  const links = [
    {
      label: "HOME",
      href: "/dashboard",
      icon: <House size={14} className="mr-2" />,
    },
    {
      label: "MY FILES",
      href: "/dashboard/my-files",
      icon: <FaFile size={14} className="mr-2" />,
    },
  ];

  const aiServicesLinks = useMemo(() => [
    {
      label: "APPLE DETECTION",
      href: "/dashboard/apple-detection-gcp-selected",
      icon: <Apple size={14} className="mr-2" />,
    },
  ], []); // Empty dependency array means this will only be created once

  const extraLinks = [
    {
      label: "AI SERVICES HISTORY",
      href: "/dashboard/ai-history",
      icon: <FaHistory size={14} className="mr-2" />,
    },
    {
      label: "ANALYTICS",
      href: "/dashboard/analytics",
      icon: <BarChart2 size={14} className="mr-2" />,
    },
    {
      label: "PRICING",
      href: "/dashboard/pricing",
      icon: <FaDollarSign size={14} className="mr-2" />,
    },
  ];

  useEffect(() => {
    if (aiServicesLinks.some((link) => link.href === currentPath)) {
      setOpenAccordion("item-1");
    } else {
      setOpenAccordion(undefined);
    }
  }, [currentPath, aiServicesLinks]);

  return (
    <>
      {/* Mobile Navbar */}
      <div
        style={{
          background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(132, 204, 22, 0.12) 0%, rgba(132, 204, 22, 0) 100%), rgba(132, 204, 22, 0.01)`,
          backdropFilter: "blur(36px)",
        }}
        className="border-b md:hidden flex justify-between items-center p-4 bg-white dark:bg-black shadow-md fixed top-0 left-0 right-0 z-50"
      >
        <div className="absolute top-0 left-0 w-full h-full z-[-1] bg-custom opacity-5" />
        <div className="flex items-center space-x-2 w-2/5">
          <UserButton />
          <span className="text-sm text-gray-900 uppercase dark:text-gray-100">
            {links
              .concat(aiServicesLinks)
              .concat(extraLinks)
              .find((link) => link.href === currentPath)?.label || "Dashboard"}
          </span>
        </div>

        <div className="w-1/5 flex justify-center">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="logo" width={30} height={30} />
          </Link>
        </div>

        <div className="flex items-center justify-end w-2/5 ">
          <ModeToggle />
          <Dialog>
            <DialogTrigger>
              <div className="flex flex-col items-center justify-center w-[3rem] h-9  dark:bg-dark rounded-md">
                <FaBars size={22} className="text-custom" />
              </div>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-black shadow-lg rounded-lg p-4">
              <div className="flex flex-col">
                {links.map((link) => (
                  <DialogClose asChild key={link.href}>
                    <Link
                      className={cn(
                        "px-4 py-2 rounded-lg text-left transition-colors flex items-center",
                        {
                          "text-custom": link.href === currentPath,
                          "text-gray-700 dark:text-gray-300 hover:bg-custom/10 dark:hover:bg-gray-700":
                            link.href !== currentPath,
                        }
                      )}
                      href={link.href}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </DialogClose>
                ))}
                <Accordion
                  type="single"
                  collapsible
                  value={openAccordion}
                  onValueChange={(value) => setOpenAccordion(value)}
                >
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="px-4 py-2 rounded-lg text-left font-normal transition-colors text-gray-700 dark:text-gray-300 hover:text-custom  flex items-center">
                      <div className="flex flex-row  items-center">
                        <Brain size={16} className="mr-2" />
                        AI SERVICES
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {aiServicesLinks.map((service) => (
                        <DialogClose asChild key={service.href}>
                          <Link
                            className={cn(
                              "px-4 py-2 rounded-lg text-left transition-colors flex items-center",
                              {
                                "text-custom": service.href === currentPath,
                                "text-gray-700 dark:text-gray-300 hover:bg-custom/10 dark:hover:bg-gray-700":
                                  service.href !== currentPath,
                              }
                            )}
                            href={service.href}
                          >
                            {service.icon}
                            {service.label}
                          </Link>
                        </DialogClose>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                {extraLinks.map((link) => (
                  <DialogClose asChild key={link.href}>
                    <Link
                      className={cn(
                        "px-4 py-2 rounded-lg text-left transition-colors flex items-center",
                        {
                          "text-custom": link.href === currentPath,
                          "text-gray-700 dark:text-gray-300 hover:bg-custom/10 dark:hover:bg-gray-700":
                            link.href !== currentPath,
                        }
                      )}
                      href={link.href}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </DialogClose>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sidebar for Web/Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r p-4 shadow-md h-full fixed top-0 left-0 z-40">
        <Image
          src="/logo.svg"
          alt="logo"
          width={180}
          height={180}
          onClick={() => {
            window.location.href = "/dashboard";
          }}
          className="ml-2 mb-2 cursor-pointer"
        />

        <nav className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center p-3 rounded-lg text-sm transition-colors",
                {
                  "text-custom font-medium": link.href === currentPath,
                  "text-gray-700 dark:text-gray-300 hover:text-custom dark:hover:text-custom":
                    link.href !== currentPath,
                }
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="p-3 rounded-lg text-sm transition-colors hover:text-custom dark:hover:text-custom flex items-center">
                <div className="flex flex-row items-center">
                  <Brain size={16} className="mr-2" />
                  AI SERVICES
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {aiServicesLinks.map((service) => (
                  <Link
                    key={service.href}
                    href={service.href}
                    className={cn(
                      "flex items-center p-3 rounded-lg transition-colors",
                      {
                        "text-custom font-medium":
                          service.href === currentPath,
                        "text-gray-700 dark:text-gray-300 hover:text-custom dark:hover:text-custom":
                          service.href !== currentPath,
                      }
                    )}
                  >
                    {service.icon}
                    {service.label}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {extraLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center p-3 rounded-lg transition-colors",
                {
                  "text-custom font-medium": link.href === currentPath,
                  "text-gray-700 dark:text-gray-300 hover:text-custom dark:hover:text-custom":
                    link.href !== currentPath,
                }
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
