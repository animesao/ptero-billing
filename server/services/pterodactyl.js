import axios from 'axios';
import { db } from '../db.js';
import { settings } from '../schema.js';
import { eq } from 'drizzle-orm';

async function getConfig() {
  const rows = await db.select().from(settings).where(eq(settings.group, 'pterodactyl'));
  const config = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

function getClient(config) {
  const url = config['ptero_url'] || '';
  const key = config['ptero_api_key'] || '';
  return axios.create({
    baseURL: url.replace(/\/+$/, '') + '/api/application',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  });
}

export async function createServer({ name, userId, plan, pteroUserId }) {
  const config = await getConfig();
  const client = getClient(config);

  const payload = {
    name: name,
    user: pteroUserId,
    egg: plan.eggId || parseInt(config['ptero_default_egg'] || '1'),
    docker_image: config['ptero_docker_image'] || 'ghcr.io/pterodactyl/yolks:java_17',
    startup: config['ptero_startup'] || 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar',
    environment: {
      SERVER_JARFILE: 'server.jar',
      VANILLA_VERSION: 'latest',
    },
    limits: {
      memory: plan.ramMb,
      swap: 0,
      disk: plan.diskMb,
      io: 500,
      cpu: plan.cpu,
    },
    feature_limits: {
      databases: plan.dbLimit || 0,
      backups: plan.backupLimit || 0,
      allocations: plan.slots || 1,
    },
    allocation: {
      default: parseInt(config['ptero_default_allocation'] || '1'),
    },
  };

  if (plan.nestId) payload.nest = plan.nestId;
  if (plan.nodeId) {
    payload.deploy = {
      locations: [plan.locationId || parseInt(config['ptero_default_location'] || '1')],
      dedicated_ip: false,
      port_range: [],
    };
  }

  const response = await client.post('/servers', payload);
  return response.data;
}

export async function deleteServer(pteroServerId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.delete(`/servers/${pteroServerId}`);
}

export async function suspendServer(pteroServerId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.post(`/servers/${pteroServerId}/suspend`);
}

export async function unsuspendServer(pteroServerId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.post(`/servers/${pteroServerId}/unsuspend`);
}

export async function getServerDetails(pteroServerId) {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get(`/servers/${pteroServerId}`);
  return response.data;
}

export async function listNodes() {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get('/nodes');
  return response.data;
}

export async function listLocations() {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get('/locations');
  return response.data;
}

export async function listNests() {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get('/nests');
  return response.data;
}

export async function listEggs(nestId) {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get(`/nests/${nestId}/eggs`);
  return response.data;
}

export async function createPteroUser({ email, username, firstName, lastName }) {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.post('/users', {
    email,
    username,
    first_name: firstName || username,
    last_name: lastName || 'User',
  });
  return response.data;
}

export async function getPteroUsers() {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get('/users');
  return response.data;
}

export async function testConnection() {
  try {
    const config = await getConfig();
    const client = getClient(config);
    const response = await client.get('/servers?per_page=1');
    return { success: true, message: 'Подключение успешно' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
