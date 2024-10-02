import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50 dark:bg-black">
      {/* Main content area */}
      <div className="flex flex-col items-center justify-center flex-grow px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center space-y-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-custom ">
            Welcome to Apple Crop Detection
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300">
            Select an option below to continue.
          </p>
          <div className="flex flex-col justify-center space-y-4">
            <div className="w-full flex justify-center">
              <ModeToggle />
            </div>
            <Link href="/sign-in">
              <button className=" py-2 px-4 text-sm md:text-base font-medium dark:text-white transition-colors hover:text-custom hover:dark:text-custom">
                Login
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="py-2 px-4 text-sm md:text-base font-medium dark:text-white transition-colors hover:text-custom hover:dark:text-custom">
                Register
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="py-2 px-4 text-sm md:text-base font-medium dark:text-white transition-colors hover:text-custom hover:dark:text-custom">
                Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
