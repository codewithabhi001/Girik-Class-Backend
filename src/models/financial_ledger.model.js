
export default (sequelize, DataTypes) => {
    const FinancialLedger = sequelize.define('FinancialLedger', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        invoice_id: DataTypes.UUID,
        job_id: DataTypes.UUID,
        transaction_type: { type: DataTypes.ENUM('CHARGE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'WRITEOFF'), allowNull: false },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        reference_id: DataTypes.STRING,
        performed_by: DataTypes.UUID,
        remarks: DataTypes.TEXT,
        balance_after: DataTypes.DECIMAL(10, 2),
    }, {
        tableName: 'financial_ledgers',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    FinancialLedger.associate = (models) => {
        FinancialLedger.belongsTo(models.Payment, { foreignKey: 'invoice_id' }); // Assuming Payment model acts as Invoice container
        FinancialLedger.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        FinancialLedger.belongsTo(models.User, { foreignKey: 'performed_by' });
    };

    return FinancialLedger;
};
