import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // pdfkit loads AFM/font assets from disk; bundling breaks PDFDocument construction.
  serverExternalPackages: ["pdfkit", "fontkit", "png-js", "linebreak"],
};

export default nextConfig;
