import dotenv from 'dotenv';
dotenv.config();

import db from './src/models/index.js';
import * as fileAccessService from './src/services/fileAccess.service.js';

async function test() {
    try {
        await db.sequelize.authenticate();
        console.log('DB connected.');

        const msg = await db.Message.findOne({
            include: [{ model: db.User, as: 'Sender', attributes: ['name', 'role'] }]
        });

        if (!msg) {
            console.log('No messages found in DB to test.');
            process.exit(0);
        }

        const resolved = await fileAccessService.resolveEntity(msg);
        console.log('Resolved Message Keys:', Object.keys(resolved));
        console.log('job_id value:', resolved.job_id);
        console.log('jobId value:', resolved.jobId);
        console.log('sender_id value:', resolved.sender_id);
        console.log('senderId value:', resolved.senderId);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
