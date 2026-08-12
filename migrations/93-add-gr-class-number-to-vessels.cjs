'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add gr_class_number column to vessels table
        await queryInterface.addColumn('vessels', 'gr_class_number', {
            type: Sequelize.STRING(20),
            allowNull: true,
            unique: true,
            defaultValue: null,
        });

        // Backfill existing vessels with auto-generated GR CLASS numbers
        // Format: GRC + 7-digit sequential number (e.g., GRC0000001)
        const [vessels] = await queryInterface.sequelize.query(
            `SELECT id, imo_number, created_at FROM vessels WHERE gr_class_number IS NULL ORDER BY created_at ASC`
        );

        for (let i = 0; i < vessels.length; i++) {
            const seqNum = String(i + 1).padStart(7, '0');
            const grClassNumber = `GRC${seqNum}`;
            await queryInterface.sequelize.query(
                `UPDATE vessels SET gr_class_number = ? WHERE id = ?`,
                { replacements: [grClassNumber, vessels[i].id] }
            );
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('vessels', 'gr_class_number');
    }
};
