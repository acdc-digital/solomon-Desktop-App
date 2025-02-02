     ____        _                             
    / ___|  ___ | | ___  _ __ ___   ___  _ __  
    \___ \ / _ \| |/ _ \| '_ ` _ \ / _ \| '_ \ 
     ___) | (_) | | (_) | | | | | | (_) | | | |
    |____/ \___/|_|\___/|_| |_| |_|\___/|_| |_|

Welcome!

Our Goal at ACDC.digital is to create a Full-Service workstation which enables ERP (enterprise resource planning) with integrated artificial intellgent assistants. To be a part of our jounrey, you can begin by cloning our repository and following the below steps to get started with our ongoing development:

Once cloned ensure you have pnpm installed (if not already): npm install -g pnpm

1. pnpm install

1.1. Optional development mode: pnpm run dev
2. pnpm run build
3. pnpm run start

*Note: currently we're using 'electron-builder' which provides some advanced functionality that will be more important later on during development. electron-builder is a popular alternative for generating more advanced binaries/installers (like .dmg, .exe/NSIS, .AppImage, .deb etc.). The pitfall is that the builder takes a little longer but it works none-the-less.

**Note2: I've temporarilty disabled the "prestart": "npm run build" to avoid generating a completely fresh build every time simply to expedite the above concern.
