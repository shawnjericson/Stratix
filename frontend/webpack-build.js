#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';

console.log('🚀 Manual webpack build starting...');

// Get the webpack config from react-scripts
const configFactory = require('react-scripts/config/webpack.config');
const config = configFactory('production');

// Get webpack from react-scripts
const webpack = require('react-scripts/node_modules/webpack');

// Ensure build directory exists
const buildPath = path.resolve(__dirname, 'build');
if (fs.existsSync(buildPath)) {
    fs.rmSync(buildPath, { recursive: true, force: true });
}
fs.mkdirSync(buildPath, { recursive: true });

// Copy public files
const publicPath = path.resolve(__dirname, 'public');
if (fs.existsSync(publicPath)) {
    const copyPublicFiles = (src, dest) => {
        const files = fs.readdirSync(src);
        files.forEach(file => {
            if (file === 'index.html') return; // Skip index.html, webpack will handle it
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            const stat = fs.statSync(srcFile);
            if (stat.isDirectory()) {
                fs.mkdirSync(destFile, { recursive: true });
                copyPublicFiles(srcFile, destFile);
            } else {
                fs.copyFileSync(srcFile, destFile);
            }
        });
    };
    copyPublicFiles(publicPath, buildPath);
}

// Create compiler
const compiler = webpack(config);

console.log('📦 Running webpack compilation...');

// Run the compilation
compiler.run((err, stats) => {
    if (err) {
        console.error('❌ Webpack compilation error:', err);
        process.exit(1);
    }

    if (stats.hasErrors()) {
        console.error('❌ Webpack compilation failed:');
        console.error(stats.toString({
            colors: true,
            all: false,
            errors: true,
            warnings: true
        }));
        process.exit(1);
    }

    console.log('✅ Webpack compilation completed!');
    console.log(stats.toString({
        colors: true,
        chunks: false,
        modules: false,
        children: false
    }));

    // Close the compiler
    compiler.close((closeErr) => {
        if (closeErr) {
            console.error('❌ Error closing compiler:', closeErr);
            process.exit(1);
        }
        console.log('🎉 Build process completed successfully!');
    });
});