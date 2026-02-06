const admin = require('firebase-admin');

// サービスアカウントキーのパス
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function setCors() {
    const storage = admin.storage();

    // デフォルトプロジェクトIDから推測されるバケット名のリスト
    const projectID = 'minna-no-nasu-app';
    const bucketNames = [
        `${projectID}.appspot.com`,
        `${projectID}.firebasestorage.app`,
        projectID
    ];

    console.log('Checking buckets...');

    let targetBucket = null;

    for (const name of bucketNames) {
        try {
            const bucket = storage.bucket(name);
            const [exists] = await bucket.exists();
            if (exists) {
                console.log(`✅ Found bucket: ${name}`);
                targetBucket = bucket;
                break;
            }
        } catch (e) {
            console.log(`❌ Bucket not found: ${name}`);
        }
    }

    if (!targetBucket) {
        console.log('Trying to list all buckets...');
        try {
            const [buckets] = await storage.getBuckets();
            if (buckets.length > 0) {
                console.log(`Found ${buckets.length} buckets. Using the first one: ${buckets[0].name}`);
                targetBucket = buckets[0];
            }
        } catch (e) {
            console.error('❌ Failed to list buckets:', e.message);
        }
    }

    if (!targetBucket) {
        console.error('❌ Could not find any valid bucket.');
        return;
    }

    const cors = [
        {
            origin: [
                'https://minna-no-nasu-app.netlify.app',
                'http://localhost:3000'
            ],
            method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            maxAgeSeconds: 3600
        }
    ];

    try {
        await targetBucket.setCorsConfiguration(cors);
        console.log(`✅ CORS configuration updated successfully for bucket: ${targetBucket.name}!`);
        console.log('Allowed Origins:', cors[0].origin.join(', '));
    } catch (error) {
        console.error('❌ Error setting CORS:', error.message);
    }
}

setCors();
