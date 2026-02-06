export default (sequelize, DataTypes) => {
    const PaymentTransaction = sequelize.define('PaymentTransaction', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        payment_id: DataTypes.UUID,
        gateway: DataTypes.STRING,
        transaction_ref: DataTypes.STRING,
        status: { type: DataTypes.ENUM('INITIATED', 'SUCCESS', 'FAILED'), defaultValue: 'INITIATED' },
        processed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'payment_transactions',
        underscored: true,
        timestamps: false,
    });

    PaymentTransaction.associate = (models) => {
        PaymentTransaction.belongsTo(models.Payment, { foreignKey: 'payment_id' });
    };

    return PaymentTransaction;
};
