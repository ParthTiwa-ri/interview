/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle Node.js modules that shouldn't be used in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,  // Handle 'fs' module
      net: false, // Additional Node.js modules that might be required
      tls: false,
      child_process: false,
      encoding: false // Handle 'encoding' module
    };
    
    return config;
  },
};

export default nextConfig;
