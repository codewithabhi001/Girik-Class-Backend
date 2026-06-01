import db from './src/models/index.js';
import bcrypt from 'bcrypt';

async function resetPasswords() {
    await db.sequelize.authenticate();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);
    
    await db.User.update({ password_hash: passwordHash }, { where: {} });
    console.log('All passwords reset to Password@123');
    process.exit(0);
}
resetPasswords();
