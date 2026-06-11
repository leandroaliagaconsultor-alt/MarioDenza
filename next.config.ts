import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth (lectura de .docx) es una lib de Node: que no se bundlee en el server.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
