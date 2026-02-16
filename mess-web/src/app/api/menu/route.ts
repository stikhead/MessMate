// import { NextResponse } from "next/server";
// import { cookies } from "next/headers"; // <--- Import this
// export const dynamic = "force-dynamic";

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const day = searchParams.get("day");

//   if (!day) {
//     return NextResponse.json({ error: "Day parameter required" }, { status: 400 });
//   }


//   const cookieStore = await cookies();
//   const token = cookieStore.get("accessToken")?.value;

//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
//   };

//   if (token) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

//   try {
//     const backendUrl = `http://localhost:8000/api/v1/menu/getMenu?day=${day}`;
//     console.log(`Proxying to Backend: ${backendUrl}`);

//     const res = await fetch(backendUrl, {
//       method: "GET",
//       headers: headers,
//       cache: "force-cache",
//       next: { revalidate: 3600 }
//     });

//     if (!res.ok) {
//       console.error(`Backend Error (${res.status}):`, res.statusText);
      
//       return NextResponse.json(
//         { error: "Backend rejected request" }, 
//         { status: res.status }
        
//       );
//     }

//     const data = await res.json();
//     return NextResponse.json(data);

//   } catch (error) {
//     console.error("Proxy Failed:", error);
//     return NextResponse.json({ error: "Failed to connect to backend" }, { status: 500 });
//   }
// }