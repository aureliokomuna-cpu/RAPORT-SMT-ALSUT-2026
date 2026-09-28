import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, 'server-data');
const DATA_FILE = path.join(DATA_DIR, 'coaching_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache for ultra-fast response
let serverRecords: Record<string, any> = {};

// Load existing data from file if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    if (raw && raw.trim()) {
      serverRecords = JSON.parse(raw);
      console.log(`[Store] Loaded ${Object.keys(serverRecords).length} coaching records from disk.`);
    }
  }
} catch (err) {
  console.warn('[Store] Could not load existing coaching data, starting fresh:', err);
}

// Persist helper with debounce protection
let saveTimeout: NodeJS.Timeout | null = null;
const persistToDisk = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(serverRecords, null, 2), 'utf-8');
      console.log(`[Store] Persisted ${Object.keys(serverRecords).length} records to ${DATA_FILE}`);
    } catch (e) {
      console.error('[Store] Error persisting coaching data:', e);
    }
  }, 200);
};

// SSE Connected Clients set for real-time push
const sseClients = new Set<Response>();

const broadcastSse = (payload: any) => {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
};

// Middleware
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Allow CORS for preview / dev instances
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// ==========================================
// 2-Way Merge Logic for Cross-Device Synchronization
// ==========================================
function mergeSmtRecords(existing: any, incoming: any): any {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const merged = { ...existing };

  // 1. Merge Weekly Checklists (Union of checks)
  const allMonths = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  const allWeeks = ['w1', 'w2', 'w3', 'w4'];

  const mergeWeekMaps = (targetKey: string) => {
    merged[targetKey] = merged[targetKey] || {};
    const incMap = incoming[targetKey] || {};
    const exMap = existing[targetKey] || {};

    for (const m of allMonths) {
      merged[targetKey][m] = merged[targetKey][m] || { w1: false, w2: false, w3: false, w4: false };
      for (const w of allWeeks) {
        const checked = !!(exMap[m]?.[w] || incMap[m]?.[w]);
        merged[targetKey][m][w] = checked;
      }
    }
  };

  mergeWeekMaps('checkedWeeks');
  mergeWeekMaps('checkedFurniproWeeks');
  mergeWeekMaps('checkedComserWeeks');

  // 2. Merge Custom Logs (Deduplicate by ID, union of items)
  const existingLogs: any[] = Array.isArray(existing.customLogs) ? existing.customLogs : [];
  const incomingLogs: any[] = Array.isArray(incoming.customLogs) ? incoming.customLogs : [];
  
  const logMap = new Map<string, any>();
  // Process existing first
  for (const log of existingLogs) {
    if (log && log.id) logMap.set(log.id, log);
  }
  // Process incoming
  for (const log of incomingLogs) {
    if (log && log.id) {
      if (!logMap.has(log.id)) {
        logMap.set(log.id, log);
      } else {
        // If both have it, take one with attachments or longer notes
        const prev = logMap.get(log.id);
        const prevAttCount = prev.attachments?.length || 0;
        const incAttCount = log.attachments?.length || 0;
        if (incAttCount >= prevAttCount) {
          logMap.set(log.id, { ...prev, ...log });
        }
      }
    }
  }

  // Convert back to array
  merged.customLogs = Array.from(logMap.values());

  // 3. Drive URL (use latest non-empty)
  if (incoming.driveUrl && incoming.driveUrl.trim()) {
    merged.driveUrl = incoming.driveUrl.trim();
  }

  // 4. Recalculate totalCount
  let sessionWeeks = 0;
  for (const m of allMonths) {
    const sWeeks = merged.checkedWeeks?.[m];
    const fWeeks = merged.checkedFurniproWeeks?.[m];
    const cWeeks = merged.checkedComserWeeks?.[m];
    for (const w of allWeeks) {
      if (sWeeks?.[w] || fWeeks?.[w] || cWeeks?.[w]) {
        sessionWeeks++;
      }
    }
  }
  merged.totalCount = Math.max(sessionWeeks, merged.customLogs.length);
  merged.lastAutoSavedAt = incoming.lastAutoSavedAt || existing.lastAutoSavedAt;
  merged.updatedAt = Date.now();

  return merged;
}

// ==========================================
// REST API Endpoints for Multi-Device Sync
// ==========================================

// 1. Get all coaching records
app.get('/api/coaching', (_req: Request, res: Response) => {
  res.json({
    success: true,
    records: serverRecords,
    totalRecords: Object.keys(serverRecords).length,
    timestamp: Date.now(),
  });
});

// 2. Health & Sync Status Check
app.get('/api/sync-status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    connectedClients: sseClients.size,
    recordCount: Object.keys(serverRecords).length,
    serverTime: new Date().toISOString(),
  });
});

// 3. Real-time Server-Sent Events (SSE) stream
app.get('/api/coaching/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial welcome & current state timestamp
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Heartbeat ping every 15s to keep proxy connections alive
  const pingInterval = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// 4. Batch 2-Way Sync (Called on device launch or when offline records exist)
app.post('/api/coaching/sync', (req: Request, res: Response) => {
  try {
    const { clientRecords, deviceId } = req.body;
    let modifiedNips: string[] = [];

    if (clientRecords && typeof clientRecords === 'object') {
      for (const nip in clientRecords) {
        const clientRec = clientRecords[nip];
        if (clientRec && clientRec.nip) {
          const current = serverRecords[nip];
          const merged = mergeSmtRecords(current, clientRec);
          serverRecords[nip] = merged;
          modifiedNips.push(nip);
        }
      }
      persistToDisk();
      
      // Notify other connected devices
      if (modifiedNips.length > 0) {
        broadcastSse({
          type: 'sync',
          sourceDeviceId: deviceId,
          modifiedNips,
          timestamp: Date.now(),
        });
      }
    }

    res.json({
      success: true,
      records: serverRecords,
      mergedCount: modifiedNips.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API /api/coaching/sync] Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// 5. Update single SMT record
app.put('/api/coaching/:nip', (req: Request, res: Response) => {
  try {
    const { nip } = req.params;
    const { record, deviceId } = req.body;

    if (!nip || !record) {
      res.status(400).json({ success: false, error: 'Missing NIP or record payload' });
      return;
    }

    const existing = serverRecords[nip];
    const merged = mergeSmtRecords(existing, record);
    serverRecords[nip] = merged;
    persistToDisk();

    // Broadcast to other devices
    broadcastSse({
      type: 'update_single',
      nip,
      sourceDeviceId: deviceId,
      record: merged,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      record: merged,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API /api/coaching/:nip] Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// 6. Delete a specific coaching log
app.delete('/api/coaching/:nip/logs/:logId', (req: Request, res: Response) => {
  try {
    const { nip, logId } = req.params;
    const { deviceId } = req.body || {};

    if (serverRecords[nip]) {
      const current = serverRecords[nip];
      current.customLogs = (current.customLogs || []).filter((l: any) => l.id !== logId);
      current.updatedAt = Date.now();
      persistToDisk();

      broadcastSse({
        type: 'delete_log',
        nip,
        logId,
        sourceDeviceId: deviceId,
        timestamp: Date.now(),
      });

      res.json({ success: true, record: current });
      return;
    }

    res.status(404).json({ success: false, error: 'SMT not found' });
  } catch (error) {
    console.error('[API delete log] Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ==========================================
// Vite Middleware / Production Static Hosting
// ==========================================
async function startServer() {
  if (!isProd && process.env.NODE_ENV !== 'production') {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Raport SMT Alsut Server ready on http://0.0.0.0:${PORT}`);
    console.log(`📡 Multi-Device Cloud Sync API active at /api/coaching`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
