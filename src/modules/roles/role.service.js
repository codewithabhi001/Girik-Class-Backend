import db from '../../models/index.js';
const Role = db.Role;
const Permission = db.Permission;
const RolePermission = db.RolePermission;

export const getRoles = async () => {
    return await Role.findAll({ include: ['Permissions'] });
};

export const createRole = async (data) => {
    return await Role.create(data);
};

export const assignPermissions = async (roleId, permissionIds) => {
    const role = await Role.findByPk(roleId);
    if (!role) throw { statusCode: 404, message: 'Role not found' };

    await RolePermission.destroy({ where: { role_id: roleId } });

    // Simplification: bulk create manually
    const entries = permissionIds.map(pid => ({ role_id: roleId, permission_id: pid }));
    await RolePermission.bulkCreate(entries);

    return role;
};

export const getPermissions = async () => {
    return await Permission.findAll();
};
