const Certificate = require("../models/certificateModel");

class CertificateService {
  static async getAllCertificates() {
    return Certificate.find();
  }
}

module.exports = CertificateService;
