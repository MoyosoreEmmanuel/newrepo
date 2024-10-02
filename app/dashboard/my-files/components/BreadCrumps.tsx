// components/Breadcrumbs.tsx
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Breadcrumbs = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId) {
      setBreadcrumbs((prev) => [...prev, queryId]);
    }
  }, [searchParams]);

  return (
    <Breadcrumb>
      <BreadcrumbItem
        onClick={() => router.push("/dashboard/my-files")}
        className="cursor-pointer"
      >
        Home
      </BreadcrumbItem>
      {breadcrumbs.map((crumb, index) => (
        <BreadcrumbItem
          key={index}
          onClick={() => router.push(`/dashboard/my-files/folder?id=${crumb}`)}
          className="cursor-pointer"
        >
          {crumb}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
