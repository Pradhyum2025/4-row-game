#!/bin/bash

echo "=== Frontend Connectivity Diagnostics ==="
echo ""

echo "1. Checking public IP..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "   Public IP from metadata: $PUBLIC_IP"
echo "   Expected IP: 15.206.2.160"
echo ""

echo "2. Checking frontend container status..."
docker ps | grep frontend
echo ""

echo "3. Checking frontend container logs (last 20 lines)..."
docker-compose logs --tail=20 frontend
echo ""

echo "4. Checking if port 5173 is listening on host..."
sudo netstat -tlnp | grep 5173 || ss -tlnp | grep 5173
echo ""

echo "5. Checking if port 5173 is listening inside container..."
docker exec 4-row-game_frontend_1 netstat -tlnp 2>/dev/null | grep 5173 || docker exec 4-row-game_frontend_1 ss -tlnp 2>/dev/null | grep 5173
echo ""

echo "6. Testing localhost connection from host..."
curl -v http://localhost:5173/ 2>&1 | head -20
echo ""

echo "7. Testing connection from container network..."
docker exec 4-row-game_frontend_1 curl -v http://localhost:5173/ 2>&1 | head -20
echo ""

echo "8. Checking firewall status (ufw)..."
sudo ufw status 2>/dev/null || echo "   ufw not installed or not active"
echo ""

echo "9. Checking iptables rules for port 5173..."
sudo iptables -L -n | grep 5173 || echo "   No iptables rules found for 5173"
echo ""

echo "10. Checking Docker port mapping..."
docker port 4-row-game_frontend_1 2>/dev/null || echo "   Container not found"
echo ""

echo "11. Checking security group attachment..."
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
echo "   Instance ID: $INSTANCE_ID"
echo "   Run this AWS CLI command to check security groups:"
echo "   aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[*].[GroupId,GroupName]' --output table"
echo ""

echo "=== Diagnostics Complete ==="
