const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  experimental: {
    appDir: true,
  },
  reactStrictMode: true,
});
