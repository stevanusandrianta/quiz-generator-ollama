#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');

const services = [
  { name: 'App', url: 'http://localhost:3000/health' },
  { name: 'Ollama', url: 'http://localhost:11434/api/tags' }
];

async function checkService(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name}: OK (${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name}: Failed - ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${name}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function checkDockerServices() {
  console.log('🐳 Checking Docker services...\n');
  
  exec('docker-compose ps', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Docker Compose not running or not found');
      return;
    }
    console.log(stdout);
  });
}

async function main() {
  console.log('🔍 Health Check for Multiple Choice Quiz Simulator\n');
  
  // Check Docker services
  await checkDockerServices();
  
  console.log('\n🌐 Checking HTTP services...\n');
  
  // Check HTTP services
  const results = await Promise.all(
    services.map(service => checkService(service.name, service.url))
  );
  
  const allHealthy = results.every(result => result);
  
  console.log('\n' + '='.repeat(50));
  if (allHealthy) {
    console.log('🎉 All services are healthy!');
    console.log('📱 Open http://localhost:3000 to use the app');
  } else {
    console.log('⚠️  Some services are not responding');
    console.log('💡 Try running: docker-compose up --build');
  }
  console.log('='.repeat(50));
}

main().catch(console.error); 