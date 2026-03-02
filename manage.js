#!/usr/bin/env node
const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3021/api/admin';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`[${res.statusCode}] ${parsed.error || data}`));
                    }
                } catch {
                    reject(new Error(`[${res.statusCode}] ${data}`));
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'create-collection') {
        const title = args[1];
        const slug = args[2];
        const intro = args[3] || '';
        if (!title || !slug) {
            console.error('Usage: manage.js create-collection <title> <slug> [intro]');
            process.exit(1);
        }

        try {
            const res = await request('POST', '/collections', { title, slug, intro });
            console.log('Collection created:', res.collection);
        } catch (err) {
            console.error('Failed:', err.message);
        }
    } else if (command === 'add-item') {
        const collectionId = args[1];
        const ghostPostId = args[2];
        const ghostSlug = args[3];
        if (!collectionId || !ghostPostId || !ghostSlug) {
            console.error('Usage: manage.js add-item <collectionId> <ghostPostId> <ghostSlug>');
            process.exit(1);
        }

        try {
            const res = await request('POST', `/collections/${collectionId}/items`, { ghostPostId, ghostSlug });
            console.log('Item added:', res.item);
        } catch (err) {
            console.error('Failed:', err.message);
        }
    } else if (command === 'list-collections') {
        try {
            const res = await request('GET', '/collections');
            console.table(res.collections);
        } catch (err) {
            console.error('Failed:', err.message);
        }
    } else {
        console.log(`Ghost Companion Manager API CLI
Commands:
  list-collections
  create-collection <title> <slug> [intro]
  add-item <collection_id> <ghost_post_id> <ghost_slug>
`);
    }
}

main();
