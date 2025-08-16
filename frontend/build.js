#!/usr/bin/env node

// Custom build script to bypass Vercel permission issues
process.env.NODE_ENV = 'production';
process.env.CI = 'false';

// Import the react-scripts build
const build = require('react-scripts/scripts/build');

console.log('Starting custom build process...');

// Run the build
build().then(() => {
    console.log('✅ Build completed successfully!');
}).catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});