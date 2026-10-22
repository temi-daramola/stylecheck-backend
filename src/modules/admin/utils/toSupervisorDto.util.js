export const toSupervisorDto = (supervisor) => ({
  id: supervisor._id,
  name: supervisor.name,
  email: supervisor.email,
  role: supervisor.role,
  isActive: supervisor.isActive,
  createdAt: supervisor.createdAt,
});
