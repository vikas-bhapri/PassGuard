import { NextResponse, NextRequest } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    // Exclude public routes from middleware
    const publicRoutes = ["/sign-in", "/sign-up", "/about", "/contact"];
    if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
        return NextResponse.next();
    }

    if (!refreshToken) {
        console.log("No refresh token found, redirecting to sign-in page...");
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // if (!token) {
    //     console.log("No access token found, trying to refresh...");
    //     const refreshResponse = await fetch(`${backendUrl}/auth/refresh/`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Cookie": `refresh_token=${refreshToken}`,
    //         },
    //         credentials: "include",
    //     });

    //     if (!refreshResponse.ok) {
    //         console.error("Failed to refresh token");
    //         return NextResponse.redirect(new URL("/sign-in", request.url));
    //     }

    //     const data = await refreshResponse.json();
    //     const newAccessToken = data.access_token;

    //     const response = NextResponse.next();
    //     response.cookies.set("token", newAccessToken, {
    //         httpOnly: true,
    //         path: "/",
    //         sameSite: "strict",
    //         maxAge: 60 * 30, // 30 minutes
    //     });

    //     return response;
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Apply middleware to all routes except static files and APIs
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};