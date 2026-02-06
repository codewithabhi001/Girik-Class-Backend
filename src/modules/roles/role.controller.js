import * as roleService from './role.service.js';

export const getRoles = async (req, res, next) => {
    try {
        const roles = await roleService.getRoles();
        res.json(roles);
    } catch (error) {
        next(error);
    }
};

export const createRole = async (req, res, next) => {
    try {
        const role = await roleService.createRole(req.body);
        res.status(201).json(role);
    } catch (error) {
        next(error);
    }
};

export const assignPermissions = async (req, res, next) => {
    try {
        const result = await roleService.assignPermissions(req.params.id, req.body.permissionIds);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getPermissions = async (req, res, next) => {
    try {
        const perms = await roleService.getPermissions();
        res.json(perms);
    } catch (error) {
        next(error);
    }
};
