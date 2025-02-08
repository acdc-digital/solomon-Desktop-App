     ____        _                             
    / ___|  ___ | | ___  _ __ ___   ___  _ __  
    \___ \ / _ \| |/ _ \| '_ ` _ \ / _ \| '_ \ 
     ___) | (_) | | (_) | | | | | | (_) | | | |
    |____/ \___/|_|\___/|_| |_| |_|\___/|_| |_|

Welcome!

Our Goal at ACDC.digital is to create a Full-Service workstation which enables ERP (enterprise resource planning) with integrated artificial intellgent assistants. To be a part of our jounrey, you can begin by following any of the below steps to be a part of our ongoing development:

## Download the App

You can download the latest version of the Solomon Desktop App from our [GitHub Releases page](https://github.com/acdc-digital/solomon-Desktop-App/releases).

## Try our Domain

**Deployment**   
solomon-desktop-33o1isx0l-acdcdigitals-projects.vercel.app

**Domain**   
https://solomon-desktop-app.vercel.app/

## Clone our Repo
**git clone https://github.com/acdc-digital/solomon-Desktop-App.git**

Once cloned ensure you have pnpm installed (if not already): npm install -g pnpm

1. pnpm install
2. **Optional development mode:** pnpm run dev
3. pnpm run build
4. pnpm run start

**Note:** currently we're using 'electron-builder' which provides some advanced functionality that will be more important later on during development. electron-builder is a popular alternative for generating more advanced binaries/installers (like .dmg, .exe/NSIS, .AppImage, .deb etc.). The pitfall is that the builder takes a little longer but it works none-the-less.   
**Note2:** I've temporarilty disabled the "prestart": "npm run build" to avoid generating a completely fresh build every time simply to expedite the above concern.   
**Note3:** Occassionally, you may need to manually delete the electron/ dist directory, whereas it could potentially try to load previous 'versions' when updating the version in the package.json  
**Note4:** By restricting the Linux build target to something like "AppImage", electron-builder won’t attempt to create or publish a .snap file, thus avoiding errors about “snapcraft is not installed.”

## Release Notes (development logs)
Our Front-End application is currently being hosted on Vercel, free tier as noted in the domain above.

**Latest Release:**   
v1.1.48   

**Stable Version:**
v1.1.15   

Our Nextjs front end is hosted on Vercel. The Apple .dmg has been corrected, but is non-secure. Notary has been disabled (temporarily) until a more robust structure can be reviewed for Prodcution. In the meantime, contuing in development-mode for now [scaffolding is there].

#### Git Update Version Main Commands (steps)
1. git add .
2. git commit -m "Updated Electron version to x.x.x"
3. git tag vx.x.x
4. git push origin main vx.x.x

If you follow these steps, you’ll have a smooth, automated release process.

Enjoy!
