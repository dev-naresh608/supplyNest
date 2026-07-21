import { User } from '../model/User.js';
import { Session } from '../model/Session.js';
import { LoginHistory } from '../model/LoginHistory.js';

export class AuthRepository {
  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email, isDeleted: false });
    if (includePassword) {
      query.select('+password');
    }
    return await query.exec();
  }

  async findById(id) {
    return await User.findById(id).where({ isDeleted: false }).populate('role').exec();
  }

  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async createSession(sessionData) {
    return await Session.create(sessionData);
  }

  async findSessionByToken(refreshToken) {
    return await Session.findOne({ refreshToken, isRevoked: false });
  }

  async revokeSession(sessionId, userId) {
    return await Session.findOneAndUpdate({ _id: sessionId, userId }, { isRevoked: true });
  }

  async revokeAllUserSessions(userId) {
    return await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  }

  async getUserSessions(userId) {
    return await Session.find({ userId, isRevoked: false }).sort({ lastActive: -1 }).exec();
  }

  async logLoginAttempt(data) {
    return await LoginHistory.create(data);
  }
}
