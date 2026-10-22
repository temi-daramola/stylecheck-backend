import { common } from '@common/_index.js';

const { ResponseUtils } = common.utilities;
const { NotFoundError } = common.errors;
const { Layer } = common.constants;

export class MeController {
  constructor(userDAO) {
    this.userDAO = userDAO;
  }

  async execute(userId) {
    const user = await this.userDAO.findById(userId);
    if (!user) {
      throw new NotFoundError('User', { layer: Layer.CONTROLLER });
    }

    return ResponseUtils.success('User profile retrieved', {
      account: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }
}
