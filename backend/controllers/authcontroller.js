// controllers/authcontroller.js
function authController(authService) {
  return {
    signup: async (req, res) => {
      const { username, password } = req.body;
      try {
        const result = await authService.signup(username, password);
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message || 'Signup failed' });
      }
    },

    login: async (req, res) => {
      const { username, password } = req.body;
      try {
        const result = await authService.login(username, password);
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message || 'Login failed' });
      }
    },
  };
}

module.exports = authController;
