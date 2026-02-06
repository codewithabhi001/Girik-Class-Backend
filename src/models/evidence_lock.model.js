
export default (sequelize, DataTypes) => {
    const EvidenceLock = sequelize.define('EvidenceLock', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        document_id: DataTypes.UUID,
        locked_by: DataTypes.UUID,
        locked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        reason: { type: DataTypes.STRING, allowNull: false },
        integrity_hash: { type: DataTypes.STRING, comment: 'SHA256 hash at time of locking' },
        legal_hold_id: DataTypes.UUID,
    }, {
        tableName: 'evidence_locks',
        underscored: true,
        timestamps: false,
    });

    EvidenceLock.associate = (models) => {
        EvidenceLock.belongsTo(models.Document, { foreignKey: 'document_id' });
        EvidenceLock.belongsTo(models.User, { foreignKey: 'locked_by' });
    };

    return EvidenceLock;
};
