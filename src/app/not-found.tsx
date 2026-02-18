import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Link href="/dashboard">
          <Button>대시보드로 이동</Button>
        </Link>
      </div>
    </div>
  );
}
