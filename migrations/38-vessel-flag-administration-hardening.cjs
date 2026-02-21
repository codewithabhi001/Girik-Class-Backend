'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. FlagAdministration Improvements
        const tableInfo = await queryInterface.describeTable('flag_administrations');

        // Add timestamps
        if (!tableInfo.created_at) {
            await queryInterface.addColumn('flag_administrations', 'created_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            });
        }
        if (!tableInfo.updated_at) {
            await queryInterface.addColumn('flag_administrations', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            });
        }

        // Handle flag_name -> flag_state_name rename
        if (tableInfo.flag_name && !tableInfo.flag_state_name) {
            // Drop existing index first to avoid issues during rename
            try {
                const flagIndexes = await queryInterface.showIndex('flag_administrations');
                const nameIndex = flagIndexes.find(idx => idx.fields.some(f => f.attribute === 'flag_name'));
                if (nameIndex) {
                    await queryInterface.removeIndex('flag_administrations', nameIndex.name);
                }
            } catch (e) {
                console.log('Index drop ignored:', e.message);
            }

            await queryInterface.renameColumn('flag_administrations', 'flag_name', 'flag_state_name');

            // Re-add unique index on new name
            await queryInterface.addIndex('flag_administrations', ['flag_state_name'], {
                unique: true,
                name: 'flag_administrations_flag_state_name_unique'
            });
        }

        // Add index on status
        try {
            await queryInterface.addIndex('flag_administrations', ['status']);
        } catch (e) {
            console.log('Status index already exists or error:', e.message);
        }

        // 2. Vessel Model Changes - Phase 1 (Add column)
        const vesselTableInfo = await queryInterface.describeTable('vessels');

        if (!vesselTableInfo.updated_at) {
            await queryInterface.addColumn('vessels', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            });
        }

        if (!vesselTableInfo.flag_administration_id) {
            await queryInterface.addColumn('vessels', 'flag_administration_id', {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'flag_administrations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            });
        }

        // 3. Data Migration - Populate flag_administration_id
        const [vessels] = await queryInterface.sequelize.query('SELECT id, flag_state FROM vessels');

        for (const vessel of vessels) {
            let flagState = vessel.flag_state || 'UNKNOWN';

            const flags = await queryInterface.sequelize.query(
                `SELECT id FROM flag_administrations WHERE flag_state_name = :flagName`,
                {
                    replacements: { flagName: flagState },
                    type: Sequelize.QueryTypes.SELECT
                }
            );

            let flagId;
            if (!flags || flags.length === 0) {
                flagId = require('crypto').randomUUID();
                await queryInterface.sequelize.query(
                    `INSERT INTO flag_administrations (id, flag_state_name, status, created_at, updated_at) 
                     VALUES (:id, :name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    {
                        replacements: { id: flagId, name: flagState }
                    }
                );
            } else {
                flagId = flags[0].id;
            }

            await queryInterface.sequelize.query(
                `UPDATE vessels SET flag_administration_id = :flagId WHERE id = :vesselId`,
                {
                    replacements: { flagId, vesselId: vessel.id }
                }
            );
        }

        // 4. Vessel Model Changes - Phase 2 (Hardening)

        await queryInterface.changeColumn('vessels', 'flag_administration_id', {
            type: Sequelize.CHAR(36).BINARY,
            allowNull: false,
            references: {
                model: 'flag_administrations',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        });

        if (vesselTableInfo.flag_state) {
            await queryInterface.removeColumn('vessels', 'flag_state');
        }

        const [duplicates] = await queryInterface.sequelize.query(
            'SELECT imo_number, COUNT(*) as count FROM vessels GROUP BY imo_number HAVING count > 1',
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (duplicates && duplicates.length > 0) {
            throw new Error(`Duplicate IMO numbers found: ${JSON.stringify(duplicates)}. Please resolve manually.`);
        }

        await queryInterface.changeColumn('vessels', 'gross_tonnage', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
        await queryInterface.changeColumn('vessels', 'net_tonnage', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
        await queryInterface.changeColumn('vessels', 'deadweight', { type: Sequelize.DECIMAL(12, 2), allowNull: true });

        // Restore IMO uniqueness
        try {
            const vesselIndexes = await queryInterface.showIndex('vessels');
            const imoIndex = vesselIndexes.find(idx => idx.fields.some(f => f.attribute === 'imo_number'));
            if (imoIndex) {
                await queryInterface.removeIndex('vessels', imoIndex.name);
            }
        } catch (e) {
            console.log('IMO index removal ignored:', e.message);
        }

        await queryInterface.addIndex('vessels', ['imo_number'], {
            unique: true,
            name: 'vessels_imo_number_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        // Reverse changes
        // This is complex because we dropped flag_state and replaced it with an FK.
        // For a true down migration, we'd need to restore flag_state and populate it from the FK.

        await queryInterface.addColumn('vessels', 'flag_state', {
            type: Sequelize.STRING,
            allowNull: true
        });

        // Populate flag_state back
        await queryInterface.sequelize.query(`
            UPDATE vessels v
            JOIN flag_administrations f ON v.flag_administration_id = f.id
            SET v.flag_state = f.flag_state_name
        `);

        await queryInterface.removeColumn('vessels', 'flag_administration_id');
        await queryInterface.removeIndex('vessels', 'vessels_imo_number_unique'); // Changed from _unique_idx
        await queryInterface.addIndex('vessels', ['imo_number']); // Restore non-unique index

        await queryInterface.changeColumn('vessels', 'gross_tonnage', { type: Sequelize.FLOAT });
        await queryInterface.changeColumn('vessels', 'net_tonnage', { type: Sequelize.FLOAT });
        await queryInterface.changeColumn('vessels', 'deadweight', { type: Sequelize.FLOAT });

        // Reverse flag_name rename and index changes
        await queryInterface.removeIndex('flag_administrations', 'flag_administrations_flag_state_name_unique');
        await queryInterface.renameColumn('flag_administrations', 'flag_state_name', 'flag_name');
        await queryInterface.removeIndex('flag_administrations', ['status']);
    }
};
