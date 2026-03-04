import { NextResponse, NextRequest } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    // Exclude public routes from middleware
    const publicRoutes = ["/sign-in", "/sign-up", "/about", "/contact", "/forgot-password", "/reset-password"];
    if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
        return NextResponse.next();
    }

    if (!refreshToken) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (!token) {
        try {
            const refreshResponse = await fetch(`http://localhost:8000/api/v1/auth/refresh_token`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": `refresh_token=${refreshToken}`,
                    "Authorization": `Bearer ${refreshToken}`,
                },
                credentials: "include",
            });

            if (!refreshResponse.ok) {
                console.error("Failed to refresh token");
                return NextResponse.redirect(new URL("/sign-in", request.url));
            }

            const data = await refreshResponse.json();

            const response = NextResponse.next();
            
            // Set the new access token cookie from the refresh response
            if (data.access_token) {
                response.cookies.set("access_token", data.access_token, {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                    maxAge: 15 * 60, // 15 minutes
                });
            }

            return response;
        } catch (error) {
            console.error("Error refreshing token:", error);
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Apply middleware to all routes except static files and APIs
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};