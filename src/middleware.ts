export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspace/:path*",
    "/ai-chat/:path*",
    "/settings/:path*",
    "/trash/:path*",
    "/invite/:path*",
  ],
};
