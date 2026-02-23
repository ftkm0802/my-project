import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon (180x180) — used for iOS "Add to Home Screen"
export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 180,
                    height: 180,
                    background: "linear-gradient(to bottom right, #0ea5e9, #2563eb)",
                    borderRadius: 40,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0,
                }}
            >
                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 900,
                        color: "white",
                        letterSpacing: -3,
                        lineHeight: 1,
                        fontFamily: "sans-serif",
                        textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                >
                    BC
                </div>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.85)",
                        letterSpacing: 2,
                        fontFamily: "sans-serif",
                        marginTop: 2,
                    }}
                >
                    AI-Gram
                </div>
            </div>
        ),
        { ...size }
    );
}
