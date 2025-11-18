const Certificate = require("../models/certificateModel");

class AdminCertificateService {
  static async createCertificate(data) {
    const cert = new Certificate(data);
    return cert.save();
  }

  static async getAllCertificates() {
    return Certificate.find().sort({ createdAt: -1 });
  }

  static async getCertificateById(id) {
    return Certificate.findById(id);
  }

  static async updateCertificate(id, updates) {
    return Certificate.findByIdAndUpdate(id, updates, { new: true });
  }

  static async deleteCertificate(id) {
    return Certificate.findByIdAndDelete(id);
  }
}

module.exports = AdminCertificateService;
