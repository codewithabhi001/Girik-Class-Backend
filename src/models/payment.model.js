export default (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        invoice_number: DataTypes.STRING,
        amount: DataTypes.DECIMAL(10, 2),
        currency: DataTypes.STRING,
        payment_status: { type: DataTypes.ENUM('UNPAID', 'PAID', 'ON_HOLD'), defaultValue: 'UNPAID' },
        payment_date: DataTypes.DATE,
        receipt_url: DataTypes.STRING,
        verified_by_user_id: DataTypes.UUID,
    }, {
        tableName: 'payments',
        underscored: true,
        timestamps: false,
    });

    Payment.associate = (models) => {
        Payment.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        Payment.belongsTo(models.User, { foreignKey: 'verified_by_user_id', as: 'verifier' });
        Payment.hasMany(models.PaymentTransaction, { foreignKey: 'payment_id' });
    };

    return Payment;
};
