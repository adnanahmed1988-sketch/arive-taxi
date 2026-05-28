{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ Resend \} from "resend";\
\
const resend = new Resend(process.env.RESEND_API_KEY);\
\
export async function POST(req: Request) \{\
  try \{\
    const body = await req.json();\
\
    await resend.emails.send(\{\
      from: "Arive <onboarding@resend.dev>",\
      to: ["arivegroupltd@outlook.com"],\
      subject: "New Booking Request",\
      html: `\
        <h2>New Booking Request</h2>\
\
        <p><strong>Name:</strong> $\{body.fullName\}</p>\
        <p><strong>Phone:</strong> $\{body.phone\}</p>\
        <p><strong>Pickup:</strong> $\{body.pickup\}</p>\
        <p><strong>Destination:</strong> $\{body.destination\}</p>\
        <p><strong>Date:</strong> $\{body.date\}</p>\
        <p><strong>Time:</strong> $\{body.time\}</p>\
        <p><strong>Passengers:</strong> $\{body.passengers\}</p>\
        <p><strong>Vehicle:</strong> $\{body.vehicle\}</p>\
        <p><strong>Price:</strong> \'a3$\{body.price\}</p>\
      `,\
    \});\
\
    return Response.json(\{ success: true \});\
  \} catch (error) \{\
    console.error(error);\
\
    return Response.json(\
      \{ success: false \},\
      \{ status: 500 \}\
    );\
  \}\
\}}