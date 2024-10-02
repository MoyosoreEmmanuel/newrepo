import { FaCloud } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import Navbar from "./Navbar";

export default async function Dashboard() {
  const { userId } = auth();
  const isAuth = !!userId;
  const user = await currentUser();
  if (!isAuth) {
    redirect("/sign-in");
  }
  return (
    <div className="">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Welcome Card */}
          <div
            className="col-span-1 md:col-span-2 p-6 rounded-xl shadow-xl relative overflow-hidden ring-1 ring-gray-300 dark:ring-gray-700"
            style={{
              background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(132, 204, 22, 0.12) 0%, rgba(132, 204, 22, 0) 100%), rgba(132, 204, 22, 0.01)`,
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="absolute top-0 left-0 w-full h-full z-[-1] bg-custom opacity-10" />

            <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Welcome {user?.fullName}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Let’s Cultivate Smarter Farming Choices!
            </p>
          </div>

          {/* Weather Widget */}
          <div
            className="p-6 rounded-xl shadow-xl relative overflow-hidden ring-1 ring-gray-300 dark:ring-gray-700"
            style={{
              background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(132, 204, 22, 0.12) 0%, rgba(132, 204, 22, 0) 100%), rgba(132, 204, 22, 0.01)`,
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="absolute top-0 left-0 w-full h-full z-[-1] bg-custom dark:bg-custom opacity-10" />

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-xl  text-gray-900 dark:text-gray-100">
                  Ottawa,
                </h2>
                <p className="text-gray-600 dark:text-gray-300 font-semibold">
                  Canada
                </p>
              </div>
              <FaCloud className="text-4xl text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex items-center mt-4">
              <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                9.6°C
              </span>
              <div className="ml-4 text-sm text-gray-600 dark:text-gray-300">
                <p>Cloudy</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Feels like 43.2
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>UV: 8</p>
              <p>Wind: 12.2 KPH</p>
              <p>Pressure: 139 SE</p>
              <p>Humidity: 45%</p>
              <p>Precipitation: 0mm</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
