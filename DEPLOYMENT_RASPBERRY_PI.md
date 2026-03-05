# EPFS Invoice App - Raspberry Pi Deployment Guide

This guide provides instructions for deploying the EPFS Invoice Application on a Raspberry Pi running a Linux distribution (such as Raspberry Pi OS or Ubuntu).

## Features Included
- Next.js 15 Application with React 19.
- SQLite Database via `better-sqlite3`.
- Local Storage for Invoice Tracking.
- Print-to-PDF formatting.

---

## 1. Prerequisites

Before installing the app, the Raspberry Pi needs to have the following tools installed:

### Install Node.js (v18 or v20 recommended)
Run the following commands on the Raspberry Pi terminal to install Node.js via NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
Verify the installation:
```bash
node -v
npm -v
```

### Install PM2 (Process Manager)
PM2 is a production process manager for Node.js apps. It will keep the application running continuously and restart it if the Raspberry Pi reboots.
```bash
sudo npm install -g pm2
```

---

## 2. Installation Setup

1. **Extract the project folder** to your preferred location on the Raspberry Pi (e.g., `/home/pi/epfs-invoice-app` or `/var/www/epfs-invoice-app`).
2. **Navigate into the project folder:**
   ```bash
   cd /path/to/epfs-invoice-app
   ```
3. **Install Dependencies:**
   Run `npm install` to download all the required Node.js libraries. 
   *(Note: Because this project uses `better-sqlite3`, it will compile the SQLite bindings for the ARM architecture of the Raspberry Pi during installation. This may take a few minutes. Ensure you have `build-essential` and `python3` installed on the Pi if it fails: `sudo apt-get install build-essential python3`)*
   ```bash
   npm install
   ```

---

## 3. Building for Production

Next.js requires building the application for optimal performance before running it in production.
```bash
npm run build
```

---

## 4. Running the Application

Once the app is built, we will use PM2 to start the server so it runs in the background.

1. **Start the app with PM2:**
   ```bash
   pm2 start npm --name "epfs-invoice" -- run start
   ```

2. **Set PM2 to start on boot:**
   To ensure the app starts automatically if the Raspberry Pi reboots, run:
   ```bash
   pm2 startup
   ```
   *(PM2 will output a specific `sudo env PATH...` command. Copy and paste that command into your terminal as instructed).*

3. **Save the PM2 configuration:**
   ```bash
   pm2 save
   ```

---

## 5. Network Access (Local Network)

By default, Next.js runs on port `3000`. 

To access the app from another computer or phone on the same Wi-Fi network, you need to find the Raspberry Pi's local IP address:
```bash
hostname -I
```
It will return something like `192.168.1.50`.

Open a browser on any device in the network and navigate to:
`http://<RASPBERRY_PI_IP>:3000` (e.g., `http://192.168.1.50:3000`).

---

## 6. Maintenance Commands

- **To view live app logs:**
  ```bash
  pm2 logs epfs-invoice
  ```
- **To restart the app:**
  ```bash
  pm2 restart epfs-invoice
  ```
- **To stop the app:**
  ```bash
  pm2 stop epfs-invoice
  ```

---

## Database Note
The SQLite database file where invoices are saved will be automatically created at `data/invoices.db` inside this project folder structure. Ensure the user running the app (typically `pi`) has read/write permissions for the `data` folder.
