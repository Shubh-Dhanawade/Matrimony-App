const states = require("../data/india_states.json");
const allDistricts = require("../data/india_districts.json");
const allTalukas = require("../data/india_talukas.json");

const locationController = {
  // GET /api/location/states
  getStates: (req, res) => {
    try {
      res.json(states);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch states" });
    }
  },

  // GET /api/location/districts/:stateId
  getDistricts: (req, res) => {
    try {
      const { stateId } = req.params;
      const districts = allDistricts[stateId] || [];
      res.json(districts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  },

  // GET /api/location/talukas/:districtId
  getTalukas: (req, res) => {
    try {
      const { districtId } = req.params;
      const talukas = allTalukas[districtId] || [];
      res.json(talukas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch talukas" });
    }
  },
};

module.exports = locationController;
