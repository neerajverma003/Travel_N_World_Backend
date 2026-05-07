import Agent from "../models/agent.js";
import { AppError } from "../utils/errorHandler.js";
import { ROLES } from "../utils/constant.js";

// Role hierarchy
export const ROLE_HIERARCHY = {
  [ROLES.AGENT]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPERADMIN]: 3
};

// Role permissions
export const ROLE_PERMISSIONS = {
  [ROLES.AGENT]: [
    'read_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_public_content'
  ],
  [ROLES.ADMIN]: [
    'read_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_public_content',
    'manage_agents',
    'manage_content',
    'view_agent_stats',
    'create_agents',
    'update_agents',
    'delete_agents',
    'toggle_agent_status',
    'change_agent_passwords'
  ],
  [ROLES.SUPERADMIN]: [
    'read_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_public_content',
    'manage_agents',
    'manage_content',
    'view_agent_stats',
    'create_agents',
    'update_agents',
    'delete_agents',
    'toggle_agent_status',
    'change_agent_passwords',
    'create_admins',
    'manage_admins',
    'system_settings',
    'audit_logs',
    'backup_restore'
  ]
};

// Check if agent has permission
export const hasPermission = (agentRole, permission) => {
  const permissions = ROLE_PERMISSIONS[agentRole] || [];
  return permissions.includes(permission);
};

// Check if agent can manage another agent
export const canManageAgent = (managerRole, targetRole) => {
  const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

  return managerLevel > targetLevel;
};

// Check if agent can assign a role
export const canAssignRole = (assignerRole, targetRole) => {
  const assignerLevel = ROLE_HIERARCHY[assignerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

  return assignerLevel > targetLevel;
};

// Get all roles that current agent can assign
export const getAssignableRoles = (agentRole) => {
  const agentLevel = ROLE_HIERARCHY[agentRole] || 0;
  const assignableRoles = [];

  Object.entries(ROLE_HIERARCHY).forEach(([role, level]) => {
    if (level < agentLevel) {
      assignableRoles.push(role);
    }
  });

  return assignableRoles;
};

// Validate superadmin operations
export const validateSuperAdminOperation = async (operation, agentId = null) => {
  const superAdminCount = await Agent.countDocuments({ role: ROLES.SUPERADMIN });

  if (operation === 'delete' && agentId) {
    const agent = await Agent.findById(agentId);
    if (agent && agent.role === ROLES.SUPERADMIN && superAdminCount <= 1) {
      throw new AppError("Cannot delete the last SUPERADMIN", 403);
    }
  }

  if (operation === 'deactivate' && agentId) {
    const agent = await Agent.findById(agentId);
    if (agent && agent.role === ROLES.SUPERADMIN) {
      throw new AppError("Cannot deactivate SUPERADMIN", 403);
    }
  }

  return true;
};

// Get role statistics
export const getRoleStatistics = async () => {
  const stats = await Agent.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        }
      }
    }
  ]);

  const result = {};
  stats.forEach(stat => {
    result[stat._id] = {
      total: stat.count,
      active: stat.active,
      inactive: stat.inactive
    };
  });

  return result;
};

// Audit log for role changes
export const logRoleChange = async (changedBy, targetAgent, oldRole, newRole, reason = '') => {
  console.log(`Role Change Audit: ${changedBy.email} changed ${targetAgent.email} from ${oldRole} to ${newRole}. Reason: ${reason}`);
  // In real app, save to AuditLog collection
};

// Check if agent can perform action
export const canPerformAction = (agentRole, action, resourceType) => {
  const permissions = ROLE_PERMISSIONS[agentRole] || [];

  const actionMappings = {
    'create_agent': 'create_agents',
    'read_agent': 'manage_agents',
    'update_agent': 'update_agents',
    'delete_agent': 'delete_agents',
    'toggle_agent_status': 'toggle_agent_status',
    'change_agent_password': 'change_agent_passwords',
    'create_admin': 'create_admins',
    'manage_admin': 'manage_admins',
    'view_stats': 'view_agent_stats',
    'system_settings': 'system_settings',
    'audit_logs': 'audit_logs'
  };

  const requiredPermission = actionMappings[action];
  return requiredPermission ? permissions.includes(requiredPermission) : false;
};
