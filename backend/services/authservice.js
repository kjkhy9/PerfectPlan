// services/authservice.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(UserModel, jwtSecret) {
    this.User = UserModel;
    this.jwtSecret = jwtSecret;
  }

  async signup(username, password) {
    const existing = await this.User.findOne({ username });
    if (existing) throw new Error('Username already in use');

    const hashed = await bcrypt.hash(password, 10);
    await this.User.create({ username, password: hashed });
    return { message: 'User created successfully' };
  }

  async login(username, password) {
    const user = await this.User.findOne({ username });
    if (!user) throw new Error('User not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error('Invalid password');

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    return { token };
  }
}

module.exports = AuthService;
