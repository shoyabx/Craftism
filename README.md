# Craftism# Craftism – Production Deployment on Google Cloud (Docker + Nginx)

This repository documents the end-to-end setup and deployment of the **Craftism** static website on **Google Cloud Platform**, using **Docker** and **Nginx**, with a custom domain and DNS configuration.

The goal of this setup was to learn and implement a **production-grade, low-cost deployment** for a static website.

Code on **Google Antigravity**
Login and Database management on **Supabase**
Domain Managed on **DNS Exit***
Commit to **Github**
Hosted on ***Google Cloud***


---

## 🌐 Live URLs

- **Primary domain (HTTP):** http://craftism.run.place  
- **Server IP:** http://136.113.210.199  

> HTTPS will be added as a next step using Let’s Encrypt once DNS is fully stable.

---

## 🧱 Architecture Overview
Local Machine (macOS)
↓
Google Cloud VM (e2-micro – free tier)
↓
Docker (docker-compose)
↓
Nginx (nginx:alpine)
↓
Static HTML/CSS/JS Website

---

## ☁️ Cloud Infrastructure

- **Cloud Provider:** Google Cloud Platform (GCP)
- **Service:** Compute Engine (VM)
- **Machine Type:** e2-micro (Always Free tier)
- **OS:** Ubuntu (minimal)
- **Region:** us-central1
- **Public IP:** 136.113.210.199

---

## 📦 Application Stack

- **Web Server:** Nginx
- **Containerization:** Docker + Docker Compose
- **Deployment Type:** Volume-mounted static site
- **Source of Truth:** Local development machine / GitHub

---

## 📁 Directory Structure (on VM)
/home/shoyab_mail/craftism/
├── docker-compose.yml
└── Crystal/
├── index.html
├── about.html
├── login.html
├── register.html
├── profile.html
├── css/
├── js/
├── modules/
└── setup.sql
---

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
version: "3.9"

services:
  web:
    image: nginx:alpine
    container_name: craftism-web
    ports:
      - "80:80"
    volumes:
      - ./Crystal:/usr/share/nginx/html:ro
    restart: always

	•	Static files are mounted directly into the Nginx container.
	•	Any change to files is reflected immediately without rebuilding images.


🌍 Domain & DNS Configuration
	•	Domain: craftism.run.place (free subdomain)
	•	DNS Records:

A Record (Root Domain): craftism.run.place → 136.113.210.199

## CNAME Record
www.craftism.run.place → craftism.run.place
DNS propagation took several hours due to ISP caching and high TTL values.


🚀 Deployment Workflow

Initial Deployment
	1.	Create VM on Google Cloud
	2.	Install Docker and Docker Compose
	3.	Upload website files to VM
	4.	Configure docker-compose.yml
	5.	Start container: docker compose up -d
	6.	Verify:
      zdocker ps
      curl http://localhost
🔄 Updating the Website (Current Workflow)

Option 1: Manual Update (Current)
	1.	Make changes locally on macOS
	2.	Compress site:tar -czf Crystal.tar.gz Crystal
	3.	Upload via GCP Browser SSH
	4.	Extract on VM:
      rm -rf ~/craftism/Crystal
      tar -xzf Crystal.tar.gz -C ~/craftism
	5.	Changes reflect immediately (no Docker restart needed)


🔐 Security & Networking Notes
	•	HTTP only (for now)
	•	HTTPS will be added using Let’s Encrypt
	•	No inbound ports exposed except 80
	•	Docker container restarts automatically on VM reboot

🧠 Key Learnings
	•	DNS propagation and caching can differ across resolvers (ISP vs Google DNS)
	•	Free subdomain providers may use fallback IPs until DNS stabilizes
	•	Docker volume mounts are ideal for static sites
	•	HTTPS cannot be enabled on raw IPs (domain required)
	•	Always verify:
      docker ps
      dig domain +short
