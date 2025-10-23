# Deployment Guide for AWS EC2 Free Tier

This guide will help you deploy the Qi Learning App to an AWS EC2 free tier instance.

## Prerequisites

- AWS Account
- EC2 instance (Amazon Linux 2 or Ubuntu)
- SSH access to your EC2 instance
- Basic command line knowledge

## Step-by-Step Deployment

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2
2. Launch Instance
3. Choose: **Amazon Linux 2 AMI** (free tier eligible)
4. Instance type: **t2.micro** (free tier eligible)
5. Configure Security Group:
   - SSH (port 22) - Your IP
   - HTTP (port 80) - Anywhere
   - Custom TCP (port 3000) - Anywhere (for testing)
6. Create/Select key pair
7. Launch instance

### 2. Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### 3. Install Node.js

```bash
# Update system
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install Git (if not already installed)

```bash
sudo yum install git -y
```

### 5. Clone Your Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/quizlet-app.git
cd quizlet-app
```

Or upload files manually:

```bash
# On your local machine
scp -i your-key.pem -r ./quizlet-app ec2-user@your-ec2-ip:~/
```

### 6. Automated Deployment (Recommended)

The easiest way to deploy is using the automated deployment script:

```bash
chmod +x init-deploy.sh
./init-deploy.sh
```

This script will automatically:
- Check and install Node.js if needed
- Install dependencies
- Create .env file with random SESSION_SECRET
- Initialize database
- Install and configure PM2
- Configure firewall
- Start the application

**That's it!** The app will be running on port 80.

### 7. Manual Deployment (Alternative)

If you prefer manual setup:

```bash
# Copy environment file
cp .env.example .env

# Generate random secret
openssl rand -base64 32

# Edit .env file
nano .env
```

Set a strong SESSION_SECRET:

```env
PORT=80
NODE_ENV=production
SESSION_SECRET=your-generated-secret-from-above
APP_NAME=Qi Learning App
```

Save and exit (Ctrl+X, Y, Enter)

Install dependencies and initialize:

```bash
npm install --production
npm run init-db
```

### 8. Test the Application

Open your browser and go to:
```
http://your-ec2-public-ip:3000
```

Login with default credentials:
- Username: `admin`
- Password: `admin123`

### 9. Run as Background Service (Optional but Recommended)

To keep the app running after you disconnect SSH, use PM2:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start app with PM2
pm2 start src/server.js --name quizlet-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you (copy and run it)

# Check status
pm2 status

# View logs
pm2 logs quizlet-app

# Restart app
pm2 restart quizlet-app

# Stop app
pm2 stop quizlet-app
```

### 10. Setup Nginx Reverse Proxy (Optional)

To serve the app on port 80 (HTTP):

```bash
# Install Nginx
sudo amazon-linux-extras install nginx1 -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure Nginx
sudo nano /etc/nginx/conf.d/quizlet.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or use your EC2 public IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Save and restart Nginx:

```bash
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

Now access your app at: `http://your-ec2-public-ip`

### 11. Setup SSL with Let's Encrypt (Optional)

If you have a domain name:

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Managing the Application

### Update Application

**Using automated script (Recommended):**

```bash
cd ~/quizlet-app
./update-deploy.sh
```

This will:
- Backup database
- Pull latest code (if using git)
- Update dependencies
- Restart application

**Manual update:**

```bash
cd ~/quizlet-app
git pull origin main
npm install --production
pm2 restart quizlet-app
```

### Backup Database

```bash
# Backup
cp ~/quizlet-app/data/quizlet.db ~/quizlet-backup-$(date +%Y%m%d).db

# Restore
cp ~/quizlet-backup-YYYYMMDD.db ~/quizlet-app/data/quizlet.db
pm2 restart quizlet-app
```

### View Logs

```bash
# PM2 logs
pm2 logs quizlet-app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring

```bash
# Check app status
pm2 status

# Monitor resources
pm2 monit

# System resources
top
free -m
df -h
```

## Security Checklist

- [ ] Change default admin password
- [ ] Setup MFA for admin account
- [ ] Set strong SESSION_SECRET in .env
- [ ] Configure EC2 Security Group properly
- [ ] Setup firewall (ufw or firewalld)
- [ ] Enable HTTPS with SSL certificate
- [ ] Regular backups of database
- [ ] Keep Node.js and packages updated
- [ ] Monitor logs regularly

## Firewall Configuration (Optional)

```bash
# Amazon Linux 2
sudo yum install firewalld -y
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh

# Allow HTTP
sudo firewall-cmd --permanent --add-service=http

# Allow HTTPS
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## Troubleshooting

### App won't start

```bash
# Check Node.js is installed
node --version

# Check for errors in code
cd ~/quizlet-app
npm install
node src/server.js
```

### Port 3000 already in use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Database errors

```bash
cd ~/quizlet-app
npm run init-db
```

### Can't access from browser

1. Check EC2 Security Group allows port 3000
2. Check app is running: `pm2 status`
3. Check firewall settings

## Performance Optimization for Free Tier

The t2.micro instance has limited resources (1 GB RAM, 1 vCPU). Here are some tips:

1. **Use PM2 max memory restart**:
   ```bash
   pm2 start src/server.js --name quizlet-app --max-memory-restart 400M
   ```

2. **Setup swap space**:
   ```bash
   sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

3. **Monitor resource usage**:
   ```bash
   pm2 monit
   ```

## Estimated Costs

- EC2 t2.micro: **FREE** (first 12 months, 750 hours/month)
- Data transfer: Usually **FREE** for normal usage
- Storage (EBS): ~$1/month for 8-30 GB

After free tier expires:
- EC2 t2.micro: ~$8-10/month
- Total: ~$10-12/month

## Alternative: Using Amazon Lightsail

For a simpler setup, consider Amazon Lightsail:
- $3.50/month for basic instance
- Easier to manage
- Includes static IP and data transfer

## Support

For issues:
1. Check application logs: `pm2 logs quizlet-app`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system resources: `top` or `htop`
4. Restart services: `pm2 restart all` or `sudo systemctl restart nginx`
