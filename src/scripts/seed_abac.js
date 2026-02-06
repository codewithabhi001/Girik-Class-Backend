
import db from '../models/index.js';

const seedPolicies = async () => {
    try {
        console.log('Seeding ABAC Policies...');

        // Clear existing policies to avoid duplicates (for dev/seed)
        // await db.AbacPolicy.destroy({ where: {}, truncate: true });

        const policies = [
            // --- JOB POLICIES ---
            {
                name: 'Job_Read_Own_Client',
                resource: 'JOB',
                condition_script: 'user.id == resource.requested_by_user_id',
                effect: 'ALLOW',
                description: 'Client can view their own jobs'
            },
            {
                name: 'Job_Read_Assigned_Surveyor',
                resource: 'JOB',
                condition_script: 'user.id == resource.gm_assigned_surveyor_id',
                effect: 'ALLOW',
                description: 'Surveyor can view jobs assigned to them'
            },
            {
                name: 'Job_Admin_GM_Access',
                resource: 'JOB',
                condition_script: "['ADMIN', 'GM', 'TM'].includes(user.role)",
                effect: 'ALLOW',
                description: 'Admins, GMs, and TMs can view all jobs'
            },
            {
                name: 'Job_Update_Assigned_Surveyor',
                resource: 'JOB',
                condition_script: "user.role == 'SURVEYOR' && user.id == resource.gm_assigned_surveyor_id",
                effect: 'ALLOW',
                description: 'Surveyor can update their assigned jobs'
            }
        ];

        for (const policy of policies) {
            const [p, created] = await db.AbacPolicy.findOrCreate({
                where: { name: policy.name },
                defaults: policy
            });
            if (created) {
                console.log(`Created policy: ${policy.name}`);
            } else {
                console.log(`Policy exists: ${policy.name}`);
                // Update implementation if needed
                await p.update(policy);
            }
        }

        console.log('ABAC Policies Seeded Successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding ABAC policies:', error);
        process.exit(1);
    }
};

seedPolicies();
