import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";

const AuthNavbar = () => {
  return (
    <div className=" p-4 flex justify-center items-center">
      <ModeToggle />
    </div>
  );
};

export default AuthNavbar;
