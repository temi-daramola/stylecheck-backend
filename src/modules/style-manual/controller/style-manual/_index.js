import { getMyManual } from '@modules/style-manual/controller/style-manual/getMyManual.js';
import { uploadManual } from '@modules/style-manual/controller/style-manual/uploadManual.js';

class StyleManualController {
  constructor(styleManualDAO, geminiAdapter) {
    this.styleManualDAO = styleManualDAO;
    this.geminiAdapter = geminiAdapter;
  }

  async getMyManual(supervisorId) {
    return getMyManual.call(this, supervisorId);
  }

  async uploadManual(supervisorId, input) {
    return uploadManual.call(this, supervisorId, input);
  }
}

export default StyleManualController;
