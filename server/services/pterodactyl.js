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

// Получить все ноды с деталями
export async function getNodes() {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get('/nodes?per_page=100');
  return response.data.data || [];
}

// Получить все локации
export async function getLocations() {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get('/locations?per_page=100');
  return response.data.data || [];
}

// Получить все гнёзда с яйцами
export async function getNestsWithEggs() {
  const config = await getConfig();
  const client = getClient(config);
  const nestsResponse = await client.get('/nests?per_page=100');
  const nests = nestsResponse.data.data || [];

  const result = [];
  for (const nest of nests) {
    try {
      const eggsResponse = await client.get(`/nests/${nest.attributes.id}/eggs?per_page=100`);
      const eggs = eggsResponse.data.data || [];
      result.push({
        id: nest.attributes.id,
        name: nest.attributes.name,
        description: nest.attributes.description,
        eggs: eggs.map(egg => ({
          id: egg.attributes.id,
          name: egg.attributes.name,
          description: egg.attributes.description,
          dockerImage: egg.attributes.docker_image,
          startup: egg.attributes.startup,
          environment: egg.attributes.environment,
        })),
      });
    } catch (e) {
      console.error(`Failed to fetch eggs for nest ${nest.attributes.id}:`, e.message);
      result.push({
        id: nest.attributes.id,
        name: nest.attributes.name,
        description: nest.attributes.description,
        eggs: [],
      });
    }
  }
  return result;
}

// Получить все яйца из гнезда
export async function getEggsInNest(nestId) {
  const config = await getConfig();
  const client = getClient(config);
  try {
    const response = await client.get(`/nests/${nestId}/eggs?per_page=100`);
    const eggs = response.data.data || [];
    return eggs.map(egg => ({
      id: egg.attributes.id,
      name: egg.attributes.name,
      description: egg.attributes.description,
      dockerImage: egg.attributes.docker_image,
      startup: egg.attributes.startup,
    }));
  } catch (error) {
    console.error('Error getting eggs in nest:', error.message);
    return [];
  }
}

// Получить аллокации для ноды
export async function getNodeAllocations(nodeId) {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.get(`/nodes/${nodeId}/allocations?per_page=100`);
  return response.data.data || [];
}

// Получить яйцо с переменными окружения
export async function getEgg(nestId, eggId) {
  const config = await getConfig();
  const client = getClient(config);
  try {
    const response = await client.get(`/nests/${nestId}/eggs/${eggId}?include=variables`);
    return response.data;
  } catch (error) {
    console.error('Error getting egg:', error.message);
    return null;
  }
}

// Получить переменные окружения для яйца
export async function getEggVariables(nestId, eggId) {
  const config = await getConfig();
  const client = getClient(config);

  try {
    // Получаем яйцо напрямую
    const response = await client.get(`/nests/${nestId}/eggs/${eggId}`);
    const egg = response.data;

    const variables = {};
    // Переменные могут быть в attributes.variables или meta?.variables
    const eggVariables = egg.attributes?.variables || egg.meta?.variables || [];

    for (const variable of eggVariables) {
      // Используем значение по умолчанию
      const envVar = variable.env_variable || variable.environment_variable;
      const defaultValue = variable.default_value || variable.default || '';
      if (envVar) {
        variables[envVar] = defaultValue;
      }
    }

    console.log('Raw egg variables:', JSON.stringify(eggVariables));

    // Если переменных нет, возвращаем дефолтные для популярных яиц
    if (Object.keys(variables).length === 0) {
      // Дефолтные значения для Paper/Spigot/BungeeCord/Velocity
      return {
        SERVER_JARFILE: 'server.jar',
        BUILD_NUMBER: 'latest',
        MINECRAFT_VERSION: 'latest',
        FORGE_VERSION: 'latest',
        FABRIC_VERSION: 'latest',
        BUNGEE_VERSION: 'latest',
        VELOCITY_VERSION: 'latest',
      };
    }

    return variables;
  } catch (error) {
    console.error('Error getting egg variables:', error.message);
    // Возвращаем дефолтные значения для Paper/Spigot
    return {
      SERVER_JARFILE: 'server.jar',
      BUILD_NUMBER: 'latest',
    };
  }
}

// Получить свободную аллокацию на ноде
export async function getFreeAllocation(nodeId) {
  try {
    const allocations = await getNodeAllocations(nodeId);
    // Фильтруем свободные аллокации (assigned: false)
    const free = allocations.filter(a => a.attributes?.assigned === false);
    if (free.length === 0) return null;
    // Выбираем случайную свободную аллокацию
    const random = free[Math.floor(Math.random() * free.length)];
    return random.attributes.id;
  } catch (error) {
    console.error('Error getting free allocation:', error.message);
    return null;
  }
}

export async function createServer({ name, userId, plan, pteroUserId }) {
  const config = await getConfig();
  const client = getClient(config);

  console.log('Plan data:', JSON.stringify({
    id: plan.id,
    name: plan.name,
    eggId: plan.eggId,
    nestId: plan.nestId,
    nodeIds: plan.nodeIds,
    nodeId: plan.nodeId,
    allocationId: plan.allocationId,
    dockerImage: plan.dockerImage,
    startup: plan.startup,
  }));

  // Если аллокация не указана, пробуем найти свободную
  let allocationId = plan.allocationId;

  // Выбираем случайную ноду из списка если есть nodeIds
  let selectedNodeId = plan.nodeId;
  if (plan.nodeIds) {
    try {
      const nodeIdsArray = JSON.parse(plan.nodeIds);
      if (Array.isArray(nodeIdsArray) && nodeIdsArray.length > 0) {
        selectedNodeId = nodeIdsArray[Math.floor(Math.random() * nodeIdsArray.length)];
        console.log('Selected random node:', selectedNodeId);
      }
    } catch (e) {
      console.error('Failed to parse nodeIds:', e);
    }
  }

  if (!allocationId && selectedNodeId) {
    allocationId = await getFreeAllocation(parseInt(selectedNodeId));
    console.log('Auto-selected allocation ID:', allocationId);
  }

  // Получаем startup и docker_image напрямую из яйца Pterodactyl
  let eggStartup = plan.startup;
  let eggDockerImage = plan.dockerImage;
  let environment = {};

  if (plan.nestId && plan.eggId) {
    try {
      const eggClient = getClient(config);
      const eggResponse = await eggClient.get(`/nests/${plan.nestId}/eggs/${plan.eggId}`);
      const eggData = eggResponse.data;

      // Получаем startup из яйца
      if (eggData.attributes?.startup) {
        eggStartup = eggData.attributes.startup;
        console.log('Egg startup from Pterodactyl:', eggStartup);
      }

      // Получаем docker_image из яйца
      if (eggData.attributes?.docker_image) {
        eggDockerImage = eggData.attributes.docker_image;
        console.log('Egg docker_image from Pterodactyl:', eggDockerImage);
      }

      // Получаем переменные окружения из яйца
      const eggVariables = eggData.attributes?.variables || [];
      console.log('Raw egg variables:', JSON.stringify(eggVariables));

      for (const variable of eggVariables) {
        const envVar = variable.env_variable || variable.environment_variable;
        const defaultValue = variable.default_value || variable.default || '';
        const required = variable.required || false;

        if (envVar) {
          environment[envVar] = defaultValue || 'default';
        }
      }

      // Если переменных нет, добавляем универсальные для всех типов серверов
      if (Object.keys(environment).length === 0) {
        const isBungeecord = eggStartup?.includes('bungee') || eggDockerImage?.includes('bungee');
        const isVelocity = eggStartup?.includes('velocity') || eggDockerImage?.includes('velocity');
        const isForge = eggStartup?.includes('forge') || eggDockerImage?.includes('forge');

        if (isBungeecord) {
          environment = { BUNGEE_VERSION: 'latest', BUNGEE_JARFILE: 'bungeecord.jar' };
        } else if (isVelocity) {
          environment = { VELOCITY_VERSION: 'latest', VELOCITY_JARFILE: 'velocity.jar' };
        } else if (isForge) {
          environment = { FORGE_VERSION: 'latest', MINECRAFT_VERSION: 'latest', SERVER_JARFILE: 'server.jar' };
        } else {
          environment = { SERVER_JARFILE: 'server.jar', BUILD_NUMBER: 'latest', MINECRAFT_VERSION: 'latest' };
        }
      }

      console.log('Egg environment variables:', JSON.stringify(environment));
    } catch (error) {
      console.error('Error getting egg details:', error.message);
      environment = {
        SERVER_JARFILE: 'server.jar',
        BUILD_NUMBER: 'latest',
        BUNGEE_VERSION: 'latest',
        BUNGEE_JARFILE: 'bungeecord.jar',
        VELOCITY_VERSION: 'latest',
        VELOCITY_JARFILE: 'velocity.jar',
        MINECRAFT_VERSION: 'latest',
        FORGE_VERSION: 'latest',
        FABRIC_VERSION: 'latest',
        SPONGE_VERSION: 'latest',
        PAPER_VERSION: 'latest',
        SPIGOT_VERSION: 'latest',
      };
    }
  }

  const payload = {
    name: name,
    user: pteroUserId,
    egg: plan.eggId,
    docker_image: eggDockerImage,
    startup: eggStartup,
    environment: environment,
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
  };

  if (plan.nestId) payload.nest = plan.nestId;

  // Если есть аллокация - используем её, иначе пробуем deploy с рандомной нодой
  if (allocationId) {
    payload.allocation = {
      default: parseInt(allocationId),
    };
  } else if (selectedNodeId) {
    payload.deploy = {
      locations: [parseInt(selectedNodeId)],
      dedicated_ip: false,
      port_range: ['60000-60100'],
    };
  }

  try {
    const response = await client.post('/servers', payload);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      console.error('Pterodactyl API error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
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

// Получить статус сервера через Client API
export async function getServerStatus(pteroServerId) {
  try {
    const config = await getConfig();
    const client = getClient(config);

    // Используем Client API вместо Application API для получения статуса
    // Client API: /api/client/servers/{identifier}
    // Но у нас только Application API key, поэтому пробуем другой подход

    // Получаем детали сервера через Application API с relationships
    const response = await client.get(`/servers/${pteroServerId}?include=resources`);
    const attributes = response.data.attributes || {};

    console.log(`Server ${pteroServerId} status data:`, JSON.stringify({
      isInstalling: attributes.isInstalling,
      isReinstalling: attributes.isReinstalling,
      status: attributes.status,
      state: attributes.state,
      resources: attributes.resources,
    }));

    // Приоритет 1: Статус установки/переустановки
    if (attributes.isInstalling === true) {
      return 'installing';
    }

    if (attributes.isReinstalling === true) {
      return 'reinstalling';
    }

    // Приоритет 2: Проверяем state
    const state = attributes.state;
    if (state) {
      if (state === 'installing') return 'installing';
      if (state === 'reinstalling') return 'reinstalling';
      if (state === 'running') return 'running';
      if (state === 'offline') return 'offline';
      if (state === 'starting') return 'starting';
      if (state === 'stopping') return 'stopping';
      if (state === 'restarting') return 'restarting';
    }

    // Приоритет 3: Дополнительный статус
    const status = attributes.status;
    if (status) {
      if (status === 'installing') return 'installing';
      if (status === 'reinstalling') return 'reinstalling';
      if (status === 'running') return 'running';
      if (status === 'offline') return 'offline';
    }

    // По умолчанию считаем что сервер работает
    return 'running';
  } catch (error) {
    console.error('Error getting server status:', error.message);
    return 'offline';
  }
}

// Обновить параметры сервера (build)
export async function updateServerBuild(pteroServerId, { cpu, memory, disk }) {
  const config = await getConfig();
  const client = getClient(config);

  const payload = {
    limits: {
      cpu,
      memory,
      disk,
      swap: 0,
      io: 500,
    },
  };

  const response = await client.patch(`/servers/${pteroServerId}/build`, payload);
  return response.data;
}

// Переустановить сервер с новым яйцом - удаляет старый и создаёт новый
export async function reinstallServerWithEgg(pteroServerId, { egg, dockerImage, startup, serverName, userId, nodeId, allocationId, limits, featureLimits }) {
  const config = await getConfig();
  const client = getClient(config);

  console.log(`Reinstalling server ${pteroServerId} with egg ${egg}, docker: ${dockerImage}, allocation: ${allocationId}`);

  // Получаем текущие детали сервера перед удалением
  let currentNestId = null;
  try {
    const response = await client.get(`/servers/${pteroServerId}`);
    currentNestId = response.data.attributes?.nest;

    console.log(`Server ${pteroServerId} current nest: ${currentNestId}`);
  } catch (error) {
    console.error('Failed to get server details:', error.message);
  }

  // Получаем информацию о новом яйце для правильного startup
  let eggStartup = startup;
  let eggDockerImage = dockerImage;
  if (currentNestId) {
    try {
      const eggResponse = await client.get(`/nests/${currentNestId}/eggs/${egg}`);
      const eggData = eggResponse.data;
      if (eggData.attributes?.startup) {
        eggStartup = eggData.attributes.startup;
        console.log(`Egg ${egg} startup: ${eggStartup}`);
      }
      if (eggData.attributes?.docker_image) {
        eggDockerImage = eggData.attributes.docker_image;
        console.log(`Egg ${egg} docker image: ${eggDockerImage}`);
      }
    } catch (error) {
      console.error('Failed to get egg details:', error.message);
    }
  }

  // Удаляем старый сервер
  try {
    await client.delete(`/servers/${pteroServerId}`);
    console.log(`Server ${pteroServerId} deleted`);
  } catch (error) {
    console.error('Failed to delete server:', error.response?.data || error.message);
  }

  // Создаём новый сервер с тем же именем но новым яйцом
  try {
    const newServerPayload = {
      name: serverName,
      user: userId,
      egg,
      docker_image: eggDockerImage,
      startup: eggStartup,
      environment: {},
      limits: limits || {
        memory: 1024,
        swap: 0,
        disk: 5120,
        io: 500,
        cpu: 100,
      },
      feature_limits: featureLimits || {
        databases: 0,
        backups: 0,
        allocations: 1,
      },
    };

    // Если есть allocationId, используем конкретную аллокацию (НЕ deploy mode!)
    if (allocationId) {
      newServerPayload.allocation = {
        default: parseInt(allocationId),
      };
      console.log(`Using allocation ID: ${allocationId}`);
    } else if (nodeId) {
      // Только если нет allocationId, используем deploy mode
      newServerPayload.deploy = {
        locations: [parseInt(nodeId)],
        dedicated_ip: false,
        port_range: [],
      };
      console.log(`Using deploy mode with node ID: ${nodeId}`);
    }

    const response = await client.post('/servers', newServerPayload);
    const newServerId = response.data.attributes?.id;
    const newIdentifier = response.data.attributes?.identifier;
    const newAllocationId = response.data.relationships?.allocations?.data?.[0]?.id;

    console.log(`New server created: id=${newServerId}, allocation=${newAllocationId}`);
    return {
      success: true,
      pteroServerId: newServerId,
      identifier: newIdentifier,
      allocationId: newAllocationId,
    };
  } catch (error) {
    console.error('Failed to create new server:', error.response?.data || error.message);
    throw error;
  }
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

export async function createPteroUser({ email, username, firstName, lastName, password }) {
  const config = await getConfig();
  const client = getClient(config);
  const response = await client.post('/users', {
    email,
    username,
    first_name: firstName || username,
    last_name: lastName || 'User',
    password, // Передаём пароль в Pterodactyl
  });
  return response.data;
}

// Удалить пользователя
export async function deleteUser(pteroUserId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.delete(`/users/${pteroUserId}`);
}

// Заморозить пользователя
export async function suspendUser(pteroUserId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.post(`/users/${pteroUserId}/suspend`);
}

// Разморозить пользователя
export async function unsuspendUser(pteroUserId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.post(`/users/${pteroUserId}/unsuspend`);
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
