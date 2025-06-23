const mongoose = require('mongoose');

const commandingOfficerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  convoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy',
    required: true
  },

  rank: { 
    type: String, 
    required: true 
  },

  contact: { 
    type: String,
    required: true
  },
  
  experienceYears: { 
    type: Number, 
    default: 0 },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  }
});

module.exports = mongoose.model('CommandingOfficer', commandingOfficerSchema);
